/**
 * Code specific to handling IPC in the renderer process.
 */

import {
  REQUEST_API_EVENT,
  EXPOSE_API_EVENT,
  BOUND_API_EVENT,
  ApiRegistration,
  ApiRegistrationMap,
  PublicProperty,
  retryUntilTimeout,
  toIpcName,
} from "./shared_ipc";
import { Restorer, RestorerFunction } from "./restorer";

// window._ipc methods declared in preload.ts
declare global {
  interface Window {
    _ipc: {
      invoke: (channel: string, data?: any) => Promise<any>;
      send: (channel: string, data: any) => void;
      on: (channel: string, func: (data: any) => void) => void;
    };
  }
}

// Structure mapping API names to the methods they contain.
const _registrationMap: ApiRegistrationMap = {};

// Structure tracking bound APIs.
const _boundApis: Record<string, MainApiBinding<any>> = {};
let _listeningForApis = false;

/**
 * Type to which a bound API of class T conforms. It only exposes the
 * methods of class T not containing underscores.
 */
export type MainApiBinding<T> = {
  [K in Extract<keyof T, PublicProperty<keyof T>>]: T[K];
};

/**
 * Returns a window-side binding for a main API of a given class.
 * Failure of main to expose the API before timeout results in an error.
 *
 * @param <T> Class to which to bind.
 * @param apiClassName Name of the class being bound. Must be identical to
 *    the name of class T. Provides runtime information that <T> does not.
 * @param restorer Optional function for restoring the classes of returned
 *    values to the classes they had when transmitted by main. Instances of
 *    classes not restored arrive as untyped structures.
 * @returns An API of type T that can be called as if T were local.
 */
export function bindMainApi<T>(
  apiClassName: string,
  restorer?: RestorerFunction
): Promise<MainApiBinding<T>> {
  if (!_listeningForApis) {
    window._ipc.on(EXPOSE_API_EVENT, (api: ApiRegistration) => {
      _registrationMap[api.className] = api.methodNames;
    });
    _listeningForApis = true;
  }
  // Requests are only necessary after the window has been reloaded.
  window._ipc.send(REQUEST_API_EVENT, apiClassName);
  return new Promise((resolve) => {
    const api = _boundApis[apiClassName];
    if (api !== undefined) {
      resolve(api);
    } else {
      retryUntilTimeout(
        0,
        () => {
          return _attemptBindIpcApi(apiClassName, restorer, resolve);
        },
        `Timed out waiting to bind main API '${apiClassName}'`
      );
    }
  });
}

// Implements a single attempt to bind to a main API.
function _attemptBindIpcApi<T>(
  apiClassName: string,
  restorer: RestorerFunction | undefined,
  resolve: (boundApi: MainApiBinding<T>) => void
): boolean {
  const methodNames = _registrationMap[apiClassName] as [
    keyof MainApiBinding<T>
  ];
  if (methodNames === undefined) {
    return false;
  }
  const boundApi = {} as MainApiBinding<T>;
  for (const methodName of methodNames) {
    const typedMethodName: keyof MainApiBinding<T> = methodName;
    boundApi[typedMethodName] = (async (...args: any[]) => {
      if (args !== undefined) {
        for (const arg of args) {
          Restorer.makeRestorable(arg);
        }
      }
      const response = await window._ipc.invoke(
        toIpcName(apiClassName, methodName as string),
        args
      );
      if (Restorer.wasThrownError(response)) {
        throw Restorer.restoreThrownError(response, restorer);
      }
      return Restorer.restoreValue(response, restorer);
    }) as any; // typescript can't confirm the method signature
  }
  _boundApis[apiClassName] = boundApi;
  resolve(boundApi);
  console.log("BOUND", apiClassName);
  window._ipc.send(BOUND_API_EVENT, apiClassName);
  return true;
}
