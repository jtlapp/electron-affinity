/**
 * Code specific to handling IPC in the main process.
 */

import { ipcMain, BrowserWindow } from "electron";

import {
  API_REQUEST_IPC,
  API_RESPONSE_IPC,
  ApiRegistration,
  ApiRegistrationMap,
  ApiBinding,
  PublicProperty,
  toIpcName,
  retryUntilTimeout,
  exposeApi,
} from "./shared_ipc";
import { Restorer } from "./restorer";
// Use the publicly-exposed RestorerFunction type
import { RestorerFunction } from "./restorer";

//// MAIN API SUPPORT ////////////////////////////////////////////////////////

// Structure mapping API names to the methods each contains.
let _mainApiMap: ApiRegistrationMap = {};

// Error logger mainly of value for debugging the test suite.
let _errorLoggerFunc: (err: Error) => void;

/**
 * Type to which a main API of class T conforms, requiring each API to
 * return a promise. All properties of the method not beginning with an
 * underscore or a pound are considered IPC APIs. All properties beginning
 * with neither an underscore nor a pound are ignored, allowing an API
 * class to have internal structure on which the APIs rely.
 */
export type ElectronMainApi<T> = {
  [K in keyof T]: K extends PublicProperty<K>
    ? (...args: any[]) => Promise<any>
    : any;
};

/**
 * Wrapper for exceptions occurring in a main API that are to be relayed
 * as errors back to the calling window. Any uncaught exception of a main API
 * not of this type is throw within Electron and not returned to the window.
 */
export class RelayedError {
  errorToRelay: any;

  constructor(errorToRelay: any) {
    this.errorToRelay = errorToRelay;
  }
}

/**
 * Exposes a main API to all windows for possible binding.
 *
 * @param <T> (inferred type, not specified in call)
 * @param mainApi The API to expose
 * @param restorer Optional function for restoring the classes of
 *    arguments passed to main. Instances of classes not restored arrive
 *    as untyped structures.
 */
export function exposeMainApi<T>(
  mainApi: ElectronMainApi<T>,
  restorer?: RestorerFunction
): void {
  _installIpcListeners();
  exposeApi(_mainApiMap, mainApi, (ipcName, method) => {
    ipcMain.handle(ipcName, async (_event, args: any[]) => {
      try {
        Restorer.restoreArgs(args, restorer);
        //await before returning to keep Electron from writing errors
        const returnValue = await method.bind(mainApi)(...args);
        if (returnValue instanceof RelayedError) {
          throw new Error("RelayedError must be thrown, not returned");
        }
        return [returnValue, Restorer.makeRestorationInfo(returnValue)];
      } catch (err: any) {
        if (err instanceof RelayedError) {
          return Restorer.makeRethrownReturnValue(err.errorToRelay);
        }
        if (_errorLoggerFunc !== undefined) {
          _errorLoggerFunc(err);
        }
        throw err;
      }
    });
  });
}

/**
 * Receives errors thrown in main APIs that were not wrapped in RelayedError.
 */
export function setIpcErrorLogger(loggerFunc: (err: Error) => void): void {
  _errorLoggerFunc = loggerFunc;
}

//// WINDOW API SUPPORT //////////////////////////////////////////////////////

// Structure mapping window API names to the methods they contain, indexed by
// web contents ID.
const _windowApiMapByWebContentsID: Record<number, ApiRegistrationMap> = {};

// Structure tracking bound window APIs, indexed by window ID.
const _boundWindowApisByWindowID: Record<
  number,
  Record<string, ApiBinding<any>>
> = {};

/**
 * Returns a main-side binding for a window API of a given class, restricting
 * the binding to the given window. Failure of the window to expose the API
 * before timeout results in an error. There is a default timeout, but you
 * can override it with `setIpcBindingTimeout()`.
 *
 * @param <T> Class to which to bind.
 * @param apiClassName Name of the class being bound. Must be identical to
 *    the name of class T. Provides runtime information that <T> does not.
 * @returns An API of type T that can be called as if T were local.
 */
export function bindWindowApi<T>(
  window: BrowserWindow,
  apiClassName: string
): Promise<ApiBinding<T>> {
  _installIpcListeners();

  return new Promise((resolve) => {
    const windowApis = _boundWindowApisByWindowID[window.webContents.id];
    if (windowApis && windowApis[apiClassName]) {
      resolve(windowApis[apiClassName]);
    } else {
      retryUntilTimeout(
        0,
        () => {
          return _attemptBindWindowApi(window, apiClassName, resolve);
        },
        `Main timed out waiting to bind to window API '${apiClassName}'` +
          ` (window ID ${window.id})`
      );
    }
  });
}

// Implements a single attempt to bind to a window API.
function _attemptBindWindowApi<T>(
  window: BrowserWindow,
  apiClassName: string,
  resolve: (boundApi: ApiBinding<T>) => void
): boolean {
  // Wait for the window API binding to arrive.

  const windowID = window.webContents.id; // save in case window is destroyed
  let windowApiMap = _windowApiMapByWebContentsID[windowID];
  if (!windowApiMap || !windowApiMap[apiClassName]) {
    // Keep trying until window loads and initializes enough to receive request.
    window.webContents.send(API_REQUEST_IPC, apiClassName);
    return false;
  }

  // Construct the window API binding.

  const methodNames = windowApiMap[apiClassName] as [keyof ApiBinding<T>];
  const boundApi = {} as ApiBinding<T>;
  for (const methodName of methodNames) {
    const typedMethodName: keyof ApiBinding<T> = methodName;
    boundApi[typedMethodName] = ((...args: any[]) => {
      Restorer.makeArgsRestorable(args);
      window.webContents.send(
        toIpcName(apiClassName, methodName as string),
        args
      );
    }) as any; // typescript can't confirm the method signature
  }

  // Save the binding to return on duplicate binding requests.

  let windowApis = _boundWindowApisByWindowID[windowID];
  if (!windowApis) {
    windowApis = {};
    _boundWindowApisByWindowID[windowID] = windowApis;
  }
  windowApis[apiClassName] = boundApi;

  // Uninstall the binding when the window closes.

  window.on("closed", (_event: any) => {
    for (const methodName of methodNames) {
      const typedMethodName: keyof ApiBinding<T> = methodName;
      boundApi[typedMethodName] = ((..._args: any[]) => {
        throw Error("Window has closed; API unavailable");
      }) as any; // typescript can't confirm the method signature
    }
    // Deleting more than once doesn't cause an error.
    delete _boundWindowApisByWindowID[windowID];
  });

  // Return the binding to main.

  resolve(boundApi);
  return true;
}

//// COMMON MAIN & WINDOW SUPPORT API ////////////////////////////////////////

let _listeningForIPC = false;

function _installIpcListeners() {
  if (!_listeningForIPC) {
    ipcMain.on(API_REQUEST_IPC, (event, apiClassName: string) => {
      const registration: ApiRegistration = {
        className: apiClassName,
        methodNames: _mainApiMap[apiClassName],
      };
      event.sender.send(API_RESPONSE_IPC, registration);
    });
    ipcMain.on(API_RESPONSE_IPC, (event, api: ApiRegistration) => {
      let windowApiMap = _windowApiMapByWebContentsID[event.sender.id];
      if (!windowApiMap) {
        windowApiMap = {};
        _windowApiMapByWebContentsID[event.sender.id] = windowApiMap;
      }
      windowApiMap[api.className] = api.methodNames;
    });
    _listeningForIPC = true;
  }
}
