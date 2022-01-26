/**
 * Code specific to handling IPC in the renderer process.
 */

// TODO: Auto install APIs on the window object, in addition to returning it,
// to give the app flexibility.

// TODO: Change _ipc to __ipc.

// TODO: After I've finished the test suite, look at combining main/window logic.

import {
  REQUEST_API_IPC,
  EXPOSE_API_IPC,
  BOUND_API_IPC,
  ApiRegistration,
  ApiRegistrationMap,
  ApiBinding,
  PublicProperty,
  getPropertyNames,
  retryUntilTimeout,
  toIpcName,
} from "./shared_ipc";
import { Restorer, RestorerFunction } from "./restorer";

//// MAIN API SUPPORT //////////////////////////////////////////////////////

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
const _mainApiMap: ApiRegistrationMap = {};

// Structure tracking bound APIs.
const _boundMainApis: Record<string, ApiBinding<any>> = {};

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
): Promise<ApiBinding<T>> {
  _installIpcListeners();

  // Requests are only necessary after the window has been reloaded.
  window._ipc.send(REQUEST_API_IPC, apiClassName);
  return new Promise((resolve) => {
    const api = _boundMainApis[apiClassName];
    if (api !== undefined) {
      resolve(api);
    } else {
      retryUntilTimeout(
        0,
        () => {
          return _attemptBindMainApi(apiClassName, restorer, resolve);
        },
        // TODO: make error message clearer
        `Timed out waiting to bind main API '${apiClassName}'`
      );
    }
  });
}

// Implements a single attempt to bind to a main API.
function _attemptBindMainApi<T>(
  apiClassName: string,
  restorer: RestorerFunction | undefined,
  resolve: (boundApi: ApiBinding<T>) => void
): boolean {
  const methodNames = _mainApiMap[apiClassName] as [keyof ApiBinding<T>];
  if (methodNames === undefined) {
    return false;
  }
  const boundApi = {} as ApiBinding<T>;
  for (const methodName of methodNames) {
    const typedMethodName: keyof ApiBinding<T> = methodName;
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
  _boundMainApis[apiClassName] = boundApi;
  resolve(boundApi);
  window._ipc.send(BOUND_API_IPC, apiClassName);
  return true;
}

//// WINDOW API SUPPORT //////////////////////////////////////////////////////

// Structure mapping window API names to the methods each contains.
let _windowApiMap: ApiRegistrationMap = {};

/**
 * Type to which a window API of class T conforms, requiring each API to
 * return void. All properties of the method not beginning with an
 * underscore are considered IPC APIs. All properties beginning with an
 * underscore are ignored, allowing an API class to have internal
 * structure on which the APIs rely.
 */
export type ElectronWindowApi<T> = {
  [K in keyof T]: K extends PublicProperty<K> ? (...args: any[]) => void : any;
};

/**
 * Exposes a window API to main for possible binding.
 *
 * @param <T> (inferred type, not specified in call)
 * @param windowApi The API to expose to main
 * @param restorer Optional function for restoring the classes of
 *    arguments passed from main. Instances of classes not restored
 *    arrive as untyped structures.
 */
export function exposeWindowApi<T>(
  windowApi: ElectronWindowApi<T>,
  restorer?: RestorerFunction
): void {
  const apiClassName = windowApi.constructor.name;
  _installIpcListeners();

  if (_windowApiMap[apiClassName] === undefined) {
    const methodNames: string[] = [];
    for (const methodName of getPropertyNames(windowApi)) {
      if (methodName != "constructor" && !["_", "#"].includes(methodName[0])) {
        const method = (windowApi as any)[methodName];
        if (typeof method == "function") {
          window._ipc.on(toIpcName(apiClassName, methodName), (args: any[]) => {
            if (args !== undefined) {
              for (let i = 0; i < args.length; ++i) {
                args[i] = Restorer.restoreValue(args[i], restorer);
              }
            }
            method.bind(windowApi)(...args);
          });
          methodNames.push(methodName);
        }
      }
    }
    _windowApiMap[apiClassName] = methodNames;
  }
}

// Send an API registration to a window.
function sendApiRegistration(apiClassName: string) {
  const registration: ApiRegistration = {
    className: apiClassName,
    methodNames: _windowApiMap[apiClassName],
  };
  window._ipc.send(EXPOSE_API_IPC, registration);
}

//// COMMON MAIN & WINDOW SUPPORT API ////////////////////////////////////////

let _listeningForIPC = false;

function _installIpcListeners() {
  if (!_listeningForIPC) {
    // TODO: revisit the request/expose protocol
    window._ipc.on(REQUEST_API_IPC, (apiClassName: string) => {
      console.log("received API request for ", apiClassName);
      sendApiRegistration(apiClassName);
      console.log("sent registration");
    });
    window._ipc.on(EXPOSE_API_IPC, (api: ApiRegistration) => {
      _mainApiMap[api.className] = api.methodNames;
    });
    _listeningForIPC = true;
  }
}
