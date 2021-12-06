import { ipcRenderer } from "electron";

import {
  EXPOSE_API_EVENT,
  ApiRegistration,
  ApiRegistrationMap,
  PublicProperty,
  ReturnsPromise,
  toIpcName,
} from "./shared_ipc";
import { Recovery } from "./recovery";

// TODO: Look for typescript way to get instance type from class

// TODO: Should I have client API invocation timeouts?

const AWAIT_API_RETRY_MILLIS = 50;
const _registrationMap: ApiRegistrationMap = {};
const _clientApis: Record<string, ClientInvokeApi<any>> = {};
let _awaitApiTimeoutMillis = 500;
let _listeningForApis = false;

export type ClientInvokeApi<T> = {
  [K in Extract<keyof T, PublicProperty<keyof T>>]: ReturnsPromise<T[K]>;
};

export function setBindIpcApiTimeout(millis: number): void {
  _awaitApiTimeoutMillis = millis;
}

export function bindIpcApi<T>(
  apiClassName: string,
  recoveryFunc?: Recovery.RecoveryFunction
): Promise<ClientInvokeApi<T>> {
  if (!_listeningForApis) {
    ipcRenderer.on(EXPOSE_API_EVENT, (_event, api: ApiRegistration) => {
      _registrationMap[api.className] = api.methodNames;
    });
    _listeningForApis = true;
  }
  return new Promise((resolve) => {
    const api = _clientApis[apiClassName];
    if (api !== undefined) {
      resolve(api);
    } else {
      _attemptBindIpcApi<T>(resolve, 0, apiClassName, recoveryFunc);
    }
  });
}

function _attemptBindIpcApi<T>(
  resolve: (clientApi: ClientInvokeApi<T>) => void,
  elapsedMillis: number,
  apiClassName: string,
  recoveryFunc?: Recovery.RecoveryFunction
): void {
  // Wait to receive the API registration, if we don't have it yet.

  const methodNames = _registrationMap[apiClassName] as [
    keyof ClientInvokeApi<T>
  ];
  if (methodNames === undefined) {
    if (elapsedMillis >= _awaitApiTimeoutMillis) {
      throw Error(`Timed out waiting to bind IPC API '${apiClassName}'`);
    }
    setTimeout(
      () =>
        _attemptBindIpcApi<T>(
          resolve,
          elapsedMillis + AWAIT_API_RETRY_MILLIS,
          apiClassName,
          recoveryFunc
        ),
      AWAIT_API_RETRY_MILLIS
    );
  }

  // Generate the client API after receiving the API registration.

  const clientApi = {} as ClientInvokeApi<T>;
  for (const methodName of methodNames) {
    const typedMethodName: keyof ClientInvokeApi<T> = methodName;
    clientApi[typedMethodName] = (async (...args: any[]) => {
      if (args !== undefined) {
        for (const arg of args) {
          Recovery.prepareArgument(arg);
        }
      }
      let response = await ipcRenderer.invoke(
        toIpcName(apiClassName, methodName as string),
        args
      );
      if (Recovery.wasThrownError(response)) {
        throw Recovery.recoverThrownError(response, recoveryFunc);
      }
      return Recovery.recoverArgument(response, recoveryFunc);
    }) as any; // typescript can't confirm the method signature
  }
  _clientApis[apiClassName] = clientApi;
  resolve(clientApi);
}
