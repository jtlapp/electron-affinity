/**
 * Code specific to handling IPC in the renderer process.
 */

import {
  API_REQUEST_IPC,
  API_RESPONSE_IPC,
  ApiRegistration,
  ApiRegistrationMap,
  PublicProperty,
  retryUntilTimeout,
  toIpcName,
  exposeApi,
} from "./shared_ipc";
import { Restorer, RestorerFunction } from "./restorer";

//// MAIN API SUPPORT //////////////////////////////////////////////////////

/**
 * Type to which a bound main API conforms within a window, as determined by
 * the provided main API class. The type only exposes the methods of the
 * class not starting with `_` or `#`, and it returns the exact
 * return types of the individual methods, which are necessarily promises.
 *
 * @param <T> Type of the main API class
 */
export type MainApiBinding<T> = {
  [K in Extract<keyof T, PublicProperty<keyof T>>]: T[K];
};

// These window._affinity_ipc methods are defined in preload.ts
declare global {
  interface Window {
    _affinity_ipc: {
      invoke: (channel: string, data?: any) => Promise<any>;
      send: (channel: string, data: any) => void;
      on: (channel: string, func: (data: any) => void) => void;
    };
  }
}

// Structure mapping API names to the methods they contain.
const _mainApiMap: ApiRegistrationMap = {};

// Structure tracking bound main APIs.
const _boundMainApis: Record<string, MainApiBinding<any>> = {};

/**
 * Returns a window-side binding for a main API of a given class. Main must
 * have previously exposed the API. Failure of the main process to expose the
 * API before timeout results in an exception. There is a default timeout, but
 * you can override it with `setIpcBindingTimeout()`.
 *
 * @param <T> Type of the main API class to bind
 * @param apiClassName Name of the class being bound. Must be identical to
 *    the name of class T. Provides runtime information that <T> does not.
 * @param restorer Optional function for restoring the classes of API return
 *    values. Return values not restored arrive as untyped objects.
 * @returns An API of type T that can be called as if T were local to
 *    the window.
 * @see setIpcBindingTimeout
 */
export function bindMainApi<T>(
  apiClassName: string,
  restorer?: RestorerFunction
): Promise<MainApiBinding<T>> {
  _installIpcListeners();

  return new Promise((resolve) => {
    if (_boundMainApis[apiClassName]) {
      resolve(_boundMainApis[apiClassName]);
    } else {
      // Make only one request, as main must prevously expose the API.
      window._affinity_ipc.send(API_REQUEST_IPC, apiClassName);
      // Client retries so it can bind at earliest possible time.
      retryUntilTimeout(
        0,
        () => {
          return _attemptBindMainApi(apiClassName, restorer, resolve);
        },
        `Timed out waiting to bind main API '${apiClassName}'`
      );
    }
  });
}

// Implements a single attempt to bind to a main API.
function _attemptBindMainApi<T>(
  apiClassName: string,
  restorer: RestorerFunction | undefined,
  resolve: (boundApi: MainApiBinding<T>) => void
): boolean {
  // Wait for the window API binding to arrive.

  const methodNames = _mainApiMap[apiClassName] as [keyof MainApiBinding<T>];
  if (!methodNames) {
    return false;
  }

  // Construct the main API binding.

  const boundApi = {} as MainApiBinding<T>;
  for (const methodName of methodNames) {
    const typedMethodName: keyof MainApiBinding<T> = methodName;
    boundApi[typedMethodName] = (async (...args: any[]) => {
      Restorer.makeArgsRestorable(args);
      const response = await window._affinity_ipc.invoke(
        toIpcName(apiClassName, methodName as string),
        args
      );
      const returnValue = response[0];
      const info = response[1];
      if (Restorer.wasThrownValue(returnValue)) {
        throw Restorer.restoreThrownValue(returnValue, info, restorer);
      }
      return Restorer.restoreValue(returnValue, info, restorer);
    }) as any; // typescript can't confirm the method signature
  }

  // Save the binding to return on duplicate binding requests.

  _boundMainApis[apiClassName] = boundApi;

  // Return the binding to the window.

  resolve(boundApi);
  return true;
}

//// WINDOW API SUPPORT //////////////////////////////////////////////////////

// Structure mapping window API names to the methods each contains.
let _windowApiMap: ApiRegistrationMap = {};

/**
 * Type to which a window API class must conform. It requires that all
 * properties of the class not beginning with `_` or `#` be functions, which
 * will be exposed as API methods. All properties beginning with `_` or `#`
 * are ignored, which allows the API class to have internal structure on
 * which the APIs rely. Use `checkWindowApi` or `checkWindowApiClass` to
 * type-check window API classes.
 *
 * @param <T> The type of the API class itself, typically inferred from a
 *    function that accepts an argument of type `ElectronWindowApi`.
 * @see checkWindowApi
 * @see checkWindowApiClass
 */
export type ElectronWindowApi<T> = {
  [K in keyof T]: K extends PublicProperty<K> ? (...args: any[]) => void : any;
};

/**
 * Type checks the argument to ensure it conforms to the expectaions of a
 * window API (which is an instance of the API class). All properties not
 * beginning with `_` or `#` must be methods and will be interpreted as API
 * methods. Returns the argument to allow type-checking of APIs in their
 * exact place of use.
 *
 * @param <T> (inferred type, not specified in call)
 * @param api Instance of the window API class to type check
 * @return The provided window API
 * @see checkWindowApiClass
 */
export function checkWindowApi<T extends ElectronWindowApi<T>>(api: T) {
  return api;
}

/**
 * Type checks the argument to ensure it conforms to the expectations of a
 * window API class. All properties not beginning with `_` or `#` must be
 * methods and will be interpreted as API methods. Useful for getting type-
 * checking in the same file as the one having the API class. (Does not
 * return the class, because this would not be available for `import type`.)
 *
 * @param <T> (inferred type, not specified in call)
 * @param _class The window API class to type check
 * @see checkWindowApi
 */
export function checkWindowApiClass<T extends ElectronWindowApi<T>>(_class: {
  new (...args: any[]): T;
}): void {}

/**
 * Exposes a window API to the main process for possible binding.
 *
 * @param <T> (inferred type, not specified in call)
 * @param windowApi The API to expose to the main process, which must be
 *    an instance of a class conforming to type `ElectronWindowApi`
 * @param restorer Optional function for restoring the classes of
 *    arguments passed to APIs from the main process. Arguments not
 *    restored to original classes arrive as untyped objects.
 */
export function exposeWindowApi<T>(
  windowApi: ElectronWindowApi<T>,
  restorer?: RestorerFunction
): void {
  _installIpcListeners();
  exposeApi(_windowApiMap, windowApi, (ipcName, method) => {
    window._affinity_ipc.on(ipcName, (args: any[]) => {
      Restorer.restoreArgs(args, restorer);
      method.bind(windowApi)(...args);
    });
  });
}

//// COMMON MAIN & WINDOW SUPPORT API ////////////////////////////////////////

let _listeningForIPC = false;

function _installIpcListeners() {
  if (!_listeningForIPC) {
    window._affinity_ipc.on(API_REQUEST_IPC, (apiClassName: string) => {
      const registration: ApiRegistration = {
        className: apiClassName,
        methodNames: _windowApiMap[apiClassName],
      };
      window._affinity_ipc.send(API_RESPONSE_IPC, registration);
    });
    window._affinity_ipc.on(API_RESPONSE_IPC, (api: ApiRegistration) => {
      _mainApiMap[api.className] = api.methodNames;
    });
    _listeningForIPC = true;
  }
}
