import { ipcRenderer } from "electron";

import {
  EXPOSE_API_EVENT,
  BOUND_API_EVENT,
  ApiRegistration,
  ApiRegistrationMap,
  PublicProperty,
  retryUntilTimeout,
  toIpcName,
} from "./shared_ipc";
import { Recovery } from "./recovery";

// TODO: Should I have client API invocation timeouts?

const _registrationMap: ApiRegistrationMap = {};
const _clientApis: Record<string, MainApiBinding<any>> = {};
let _awaitApiTimeoutMillis = 500;
let _listeningForApis = false;

export type MainApiBinding<T> = {
  [K in Extract<keyof T, PublicProperty<keyof T>>]: T[K];
};

export function setBindIpcApiTimeout(millis: number): void {
  _awaitApiTimeoutMillis = millis;
}

export function bindIpcApi<T>(
  apiClassName: string,
  recoveryFunc?: Recovery.RecoveryFunction
): Promise<MainApiBinding<T>> {
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
      // TODO: test this
      retryUntilTimeout(
        0,
        () => {
          return _attemptBindIpcApi(apiClassName, recoveryFunc, resolve);
        },
        _awaitApiTimeoutMillis,
        `Timed out waiting to bind IPC API '${apiClassName}'`
      );
    }
  });
}

function _attemptBindIpcApi<T>(
  apiClassName: string,
  recoveryFunc: Recovery.RecoveryFunction | undefined,
  resolve: (clientApi: MainApiBinding<T>) => void
): boolean {
  const methodNames = _registrationMap[apiClassName] as [
    keyof MainApiBinding<T>
  ];
  if (methodNames === undefined) {
    return false;
  }
  const clientApi = {} as MainApiBinding<T>;
  for (const methodName of methodNames) {
    const typedMethodName: keyof MainApiBinding<T> = methodName;
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
  ipcRenderer.send(BOUND_API_EVENT, apiClassName);
  return true;
}
