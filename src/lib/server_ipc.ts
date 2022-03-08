/**
 * Code specific to handling IPC in the main process.
 */

import { ipcMain, BrowserWindow } from "electron";

import {
  API_REQUEST_IPC,
  API_RESPONSE_IPC,
  ApiRegistration,
  ApiRegistrationMap,
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
 * Type to which a main API class must conform. It requires each API method
 * to return a promise. All properties of the method not beginning with `_`
 * or `#` will be exposed as API methods. All properties beginning with `_` or
 * `#` are ignored, which allows the API class to have internal structure on
 * which the APIs rely. Have your main APIs 'implement' this type to get
 * type-checking in the APIs themselves. Use `checkMainApi` or
 * `checkMainApiClass` to type-check variables containing main APIs.
 *
 * @param <T> The type of the API class itself, typically inferred from a
 *    function that accepts an argument of type `ElectronMainApi`.
 * @see checkMainApi
 * @see checkMainApiClass
 */
export type ElectronMainApi<T> = {
  [K in keyof T]: K extends PublicProperty<K>
    ? (...args: any[]) => Promise<any>
    : any;
};

/**
 * Type checks the argument to ensure it conforms to the expectations of a
 * main API (which is an instance of the API class). All properties not
 * beginning with `_` or `#` must be methods returning promises and will be
 * interpreted as API methods. Returns the argument to allow type-checking
 * of APIs in their place of use.
 *
 * @param <T> (inferred type, not specified in call)
 * @param api Instance of the main API class to type check
 * @return The provided main API instance
 * @see checkMainApiClass
 */
export function checkMainApi<T extends ElectronMainApi<T>>(api: T): T {
  return api;
}

/**
 * Type checks the argument to ensure it conforms to the expectations of a
 * main API class. All properties not beginning with `_` or `#` must be
 * methods returning promises and will be interpreted as API methods. Returns
 * the argument to allow type-checking of APIs in their place of use.
 *
 * @param <T> (inferred type, not specified in call)
 * @param _class The main API class to type check
 * @return The provided main API class
 * @see checkMainApi
 */
export function checkMainApiClass<T extends ElectronMainApi<T>>(_class: {
  new (...args: any[]): T;
}): {
  new (...args: any[]): T;
} {
  return _class;
}

/**
 * Class that wraps exceptions occurring in a main API that are to be
 * relayed as errors back to the calling window. A main API wishing to
 * have an exception thrown in the calling window wraps the error object
 * in an instance of this class and throws the instance. The main process
 * will ignore the throw except for transferring it to the calling window.
 * Exceptions thrown within a main API not wrapped in `RelayedError` are
 * thrown within the main process as "uncaught" exceptions.
 */
export class RelayedError {
  errorToRelay: any;

  /**
   * @param errorToRelay The error to throw within the calling window,
   *    occurring within the window's call to the main API
   */
  constructor(errorToRelay: any) {
    this.errorToRelay = errorToRelay;
  }
}

/**
 * Exposes a main API to all windows for possible binding.
 *
 * @param <T> (inferred type, not specified in call)
 * @param mainApi The API to expose to all windows, which must be an
 *    instance of a class conforming to type `ElectronMainApi`
 * @param restorer Optional function for restoring the classes of
 *    arguments passed to APIs from the window. Arguments not
 *    restored to original classes arrive as untyped objects.
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

// Receives exceptions thrown in main APIs that were not wrapped in RelayedError.
export function setIpcErrorLogger(loggerFunc: (err: any) => void): void {
  _errorLoggerFunc = loggerFunc;
}

//// WINDOW API SUPPORT //////////////////////////////////////////////////////

/**
 * Type to which a bound window API conforms within the main process, as
 * determined from the provided window API class. This type only exposes the
 * methods of the class not starting with `_` or `#`, and regardless of what
 * the method returns, the API returns void.
 *
 * @param <T> Type of the window API class
 */
export type WindowApiBinding<T> = {
  [K in Extract<keyof T, PublicProperty<keyof T>>]: T[K] extends (
    ...args: infer A
  ) => any
    ? (...args: A) => void
    : never;
};

// Structure mapping window API names to the methods they contain, indexed by
// web contents ID.
const _windowApiMapByWebContentsID: Record<number, ApiRegistrationMap> = {};

// Structure tracking bound window APIs, indexed by window ID.
const _boundWindowApisByWindowID: Record<
  number,
  Record<string, WindowApiBinding<any>>
> = {};

/**
 * Returns a main-side binding for a window API of a given class, restricting
 * the binding to the given window. Failure of the window to expose the API
 * before timeout results in an exception. There is a default timeout, but
 * you can override it with `setIpcBindingTimeout()`. (The function takes no
 * restorer parameter because window APIs do not return values.)
 *
 * @param <T> Type of the window API class to bind
 * @param window Window to which to bind the window API
 * @param apiClassName Name of the class being bound. Must be identical to
 *    the name of class T. Provides runtime information that <T> does not.
 * @returns An API of type T that can be called as if T were local to the
 *    main process.
 * @see setIpcBindingTimeout
 */
export function bindWindowApi<T>(
  window: BrowserWindow,
  apiClassName: string
): Promise<WindowApiBinding<T>> {
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
  resolve: (boundApi: WindowApiBinding<T>) => void
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

  const methodNames = windowApiMap[apiClassName] as [keyof WindowApiBinding<T>];
  const boundApi = {} as WindowApiBinding<T>;
  for (const methodName of methodNames) {
    const typedMethodName: keyof WindowApiBinding<T> = methodName;
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
      const typedMethodName: keyof WindowApiBinding<T> = methodName;
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
