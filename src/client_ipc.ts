/**
 * Code specific to handling IPC in the renderer process.
 */

import {
  API_REQUEST_IPC,
  API_RESPONSE_IPC,
  ApiRegistration,
  ApiRegistrationMap,
  ApiBinding,
  PublicProperty,
  retryUntilTimeout,
  toIpcName,
  exposeApi,
} from "./shared_ipc";
import { Restorer, RestorerFunction } from "./restorer";

//// MAIN API SUPPORT //////////////////////////////////////////////////////

// These window.__ipc methods are defined in preload.ts
declare global {
  interface Window {
    __ipc: {
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
 * Main must have previously exposed the API.
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

  return new Promise((resolve) => {
    if (_boundMainApis[apiClassName]) {
      resolve(_boundMainApis[apiClassName]);
    } else {
      // Make only one request, as main must prevously expose the API.
      window.__ipc.send(API_REQUEST_IPC, apiClassName);
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
  resolve: (boundApi: ApiBinding<T>) => void
): boolean {
  // Wait for the window API binding to arrive.

  const methodNames = _mainApiMap[apiClassName] as [keyof ApiBinding<T>];
  if (!methodNames) {
    return false;
  }

  // Construct the main API binding.

  const boundApi = {} as ApiBinding<T>;
  for (const methodName of methodNames) {
    const typedMethodName: keyof ApiBinding<T> = methodName;
    boundApi[typedMethodName] = (async (...args: any[]) => {
      Restorer.makeArgsRestorable(args);
      const response = await window.__ipc.invoke(
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
 * Type to which a window API of class T conforms, expecting each API
 * to return void. All properties of the method not beginning with an
 * underscore or pound are considered IPC APIs. All properties beginning
 * with an underscore or poundare ignored, allowing an API class to have
 * internal structure on which the APIs rely.
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
  _installIpcListeners();
  exposeApi(_windowApiMap, windowApi, (ipcName, method) => {
    window.__ipc.on(ipcName, (args: any[]) => {
      Restorer.restoreArgs(args, restorer);
      method.bind(windowApi)(...args);
    });
  });
}

//// COMMON MAIN & WINDOW SUPPORT API ////////////////////////////////////////

let _listeningForIPC = false;

function _installIpcListeners() {
  if (!_listeningForIPC) {
    window.__ipc.on(API_REQUEST_IPC, (apiClassName: string) => {
      const registration: ApiRegistration = {
        className: apiClassName,
        methodNames: _windowApiMap[apiClassName],
      };
      window.__ipc.send(API_RESPONSE_IPC, registration);
    });
    window.__ipc.on(API_RESPONSE_IPC, (api: ApiRegistration) => {
      _mainApiMap[api.className] = api.methodNames;
    });
    _listeningForIPC = true;
  }
}
