/**
 * Code specific to handling IPC in the main process.
 */

// TODO: revisit/revise all comments after removing most timeouts

import { ipcMain, BrowserWindow, WebContents } from "electron";

import {
  REQUEST_API_IPC,
  EXPOSE_API_IPC,
  BOUND_API_IPC,
  ApiRegistration,
  ApiRegistrationMap,
  ApiBinding,
  PublicProperty,
  toIpcName,
  getPropertyNames,
  retryUntilTimeout,
} from "./shared_ipc";
import { Restorer } from "./restorer";
// Use the publicly-exposed RestorerFunction type
import { RestorerFunction } from "./restorer";

//// MAIN API SUPPORT ////////////////////////////////////////////////////////

// Structure mapping API names to the methods each contains.
let _mainApiMap: ApiRegistrationMap = {};

// Structure tracking which windows have bound to which main APIs before the
// window has been reloaded. After a window has reloaded, it is known that
// window is capable of binding to all APIs, and it's up to the window to
// be sure it rebinds all APIs, as main won't timeout for a reload.
let _boundMainApisByWebContentsID: Record<number, Record<string, boolean>> = {};

// Error logger mainly of value for debugging the test suite.
let _errorLoggerFunc: (err: Error) => void;

/**
 * Type to which a main API of class T conforms, requiring each API to
 * return a promise. All properties of the method not beginning with an
 * underscore are considered IPC APIs. All properties beginning with an
 * underscore are ignored, allowing an API class to have internal
 * structure on which the APIs rely.
 */
export type ElectronMainApi<T> = {
  [K in keyof T]: K extends PublicProperty<K>
    ? (...args: any[]) => Promise<any>
    : any;
};

/**
 * Wrapper for exceptions occurring in a main API that are relayed to the
 * caller in the calling window. Any uncaught exception of a main API not
 * of this type is throw within Electron and not returned to the window.
 */
export class RelayedError {
  errorToRelay: any;

  constructor(errorToRelay: any) {
    this.errorToRelay = errorToRelay;
  }
}

/**
 * Exposes a main API to a particular window, which must bind to the API.
 * Failure of the window to bind before timeout results in an error.
 *
 * @param <T> (inferred type, not specified in call)
 * @param toWindow The window to which to expose the API
 * @param mainApi The API to expose to the window
 * @param restorer Optional function for restoring the classes of
 *    arguments passed to main. Instances of classes not restored arrive
 *    as untyped structures.
 */
export function exposeMainApi<T>(
  // TODO: not specific to a window; let any window bind
  toWindow: BrowserWindow,
  mainApi: ElectronMainApi<T>,
  restorer?: RestorerFunction
): void {
  const apiClassName = mainApi.constructor.name;
  _installIpcListeners();

  if (_mainApiMap[apiClassName] === undefined) {
    const methodNames: string[] = [];
    for (const methodName of getPropertyNames(mainApi)) {
      if (methodName != "constructor" && !["_", "#"].includes(methodName[0])) {
        const method = (mainApi as any)[methodName];
        if (typeof method == "function") {
          ipcMain.handle(
            toIpcName(apiClassName, methodName),
            async (_event, args: any[]) => {
              try {
                if (args !== undefined) {
                  for (let i = 0; i < args.length; ++i) {
                    args[i] = Restorer.restoreValue(args[i], restorer);
                  }
                }
                //await before returning to keep Electron from writing errors
                const replyValue = await method.bind(mainApi)(...args);
                return Restorer.makeRestorable(replyValue);
              } catch (err: any) {
                if (err instanceof RelayedError) {
                  return Restorer.makeReturnedError(err.errorToRelay);
                }
                if (_errorLoggerFunc !== undefined) {
                  _errorLoggerFunc(err);
                }
                throw err;
              }
            }
          );
          methodNames.push(methodName);
        }
      }
    }
    _mainApiMap[apiClassName] = methodNames;
  }

  // TODO: main should not require window to bind
  retryUntilTimeout(
    0,
    () => {
      if (toWindow.isDestroyed()) {
        throw Error(`Window destroyed before binding to '${apiClassName}'`);
      }
      const boundMainApis =
        _boundMainApisByWebContentsID[toWindow.webContents.id];
      if (boundMainApis !== undefined && boundMainApis[apiClassName]) {
        return true;
      }
      sendApiRegistration(toWindow.webContents, apiClassName);
      return false;
    },
    // TODO: make error message clearer
    `Timed out waiting for main API '${apiClassName}' to bind to window ${toWindow.id}`
  );
}

// Send an API registration to a window.
function sendApiRegistration(toWebContents: WebContents, apiClassName: string) {
  const registration: ApiRegistration = {
    className: apiClassName,
    methodNames: _mainApiMap[apiClassName],
  };
  toWebContents.send(EXPOSE_API_IPC, registration);
}

/**
 * Receives errors thrown in APIs not wrapped in RelayedError.
 */
export function setIpcErrorLogger(loggerFunc: (err: Error) => void): void {
  _errorLoggerFunc = loggerFunc;
}

//// WINDOW API SUPPORT //////////////////////////////////////////////////////

// TODO: purge window data when window closes

// Structure mapping window API names to the methods they contain, indexed by
// web contents ID.
const _windowApiMapByWebContentsID: Record<number, ApiRegistrationMap> = {};

// Structure tracking bound window APIs, indexed by window ID.
// TODO: Can I replace WindowApiBinding<any> with 'true'?
const _boundWindowApisByWindowID: Record<
  number,
  Record<string, ApiBinding<any>>
> = {};

/**
 * Returns a main-side binding for a window API of a given class, restricting
 * the binding to the given window. Failure of the window to expose the API
 * before timeout results in an error.
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

  window.webContents.send(REQUEST_API_IPC, apiClassName);
  return new Promise((resolve) => {
    const api = _boundWindowApisByWindowID[window.id][apiClassName];
    if (api !== undefined) {
      resolve(api);
    } else {
      retryUntilTimeout(
        0,
        () => {
          return _attemptBindWindowApi(window, apiClassName, resolve);
        },
        `Main timed out waiting to bind window API '${apiClassName}'`
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
  const methodNames = _windowApiMapByWebContentsID[window.webContents.id][
    apiClassName
  ] as [keyof ApiBinding<T>];
  if (methodNames === undefined) {
    return false;
  }
  const boundApi = {} as ApiBinding<T>;
  for (const methodName of methodNames) {
    const typedMethodName: keyof ApiBinding<T> = methodName;
    boundApi[typedMethodName] = ((...args: any[]) => {
      if (args !== undefined) {
        for (const arg of args) {
          Restorer.makeRestorable(arg);
        }
      }
      window.webContents.send(
        toIpcName(apiClassName, methodName as string),
        args
      );
    }) as any; // typescript can't confirm the method signature
  }
  _boundWindowApisByWindowID[window.id][apiClassName] = boundApi;
  resolve(boundApi);
  return true;
}

//// COMMON MAIN & WINDOW SUPPORT API ////////////////////////////////////////

let _listeningForIPC = false;

function _installIpcListeners() {
  if (!_listeningForIPC) {
    // TODO: revisit the request/expose protocol
    ipcMain.on(REQUEST_API_IPC, (event, apiClassName: string) => {
      // Previously-bound APIs are known to be available after window reload.
      const windowApis = _boundMainApisByWebContentsID[event.sender.id];
      // TODO: This is serving as an ACL, which I decided I don't need.
      if (windowApis && windowApis[apiClassName]) {
        sendApiRegistration(event.sender, apiClassName);
      }
    });
    ipcMain.on(BOUND_API_IPC, (event, apiClassName: string) => {
      let windowApis = _boundMainApisByWebContentsID[event.sender.id];
      if (windowApis === undefined) {
        windowApis = {};
        _boundMainApisByWebContentsID[event.sender.id] = windowApis;
      }
      windowApis[apiClassName] = true;
    });
    ipcMain.on(EXPOSE_API_IPC, (event, api: ApiRegistration) => {
      _windowApiMapByWebContentsID[event.sender.id][api.className] =
        api.methodNames;
    });
    _listeningForIPC = true;
  }
}
