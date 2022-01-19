/**
 * Code specific to handling IPC in the main process.
 */

import { ipcMain, BrowserWindow, WebContents } from "electron";

import {
  REQUEST_API_EVENT,
  EXPOSE_API_EVENT,
  BOUND_API_EVENT,
  ApiRegistration,
  ApiRegistrationMap,
  PublicProperty,
  toIpcName,
  retryUntilTimeout,
} from "./shared_ipc";
import { Restorer } from "./restorer";
// Use the publicly-exposed RestorerFunction type
import { RestorerFunction } from "./restorer";

let _listeningForIPC = false;

// Structure mapping API names to the methods each contains.
let _registrationMap: ApiRegistrationMap = {};

// Structure tracking which windows have bound to which APIs before the
// window has been reloaded. After a window has reloaded, it is known that
// window is capable of binding to all APIs, and it's up to the window to
// be sure it rebinds all APIs, as main won't timeout for a reload.
let _boundApisByContentsID: Record<number, Record<string, boolean>> = {};

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
 * Wrapper for exceptions occurring in a main API that are to pass through to
 * the caller in the calling window. Any uncaught exception of a main API not
 * of this type is throw within Electron and not returned to the window.
 */
export class PassThroughError {
  errorToPass: Error;

  constructor(errorToPass: Error) {
    this.errorToPass = errorToPass;
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
  toWindow: BrowserWindow,
  mainApi: ElectronMainApi<T>,
  restorer?: RestorerFunction
): void {
  const apiClassName = mainApi.constructor.name;
  if (!_listeningForIPC) {
    ipcMain.on(REQUEST_API_EVENT, (event, apiClassName: string) => {
      // Previously-bound APIs are known to be available after window reload.
      const windowApis = _boundApisByContentsID[event.sender.id];
      if (windowApis && windowApis[apiClassName]) {
        sendApiRegistration(event.sender, apiClassName);
      }
    });
    ipcMain.on(BOUND_API_EVENT, (event, apiClassName: string) => {
      let windowApis = _boundApisByContentsID[event.sender.id];
      if (windowApis === undefined) {
        windowApis = {};
        _boundApisByContentsID[event.sender.id] = windowApis;
      }
      windowApis[apiClassName] = true;
    });
    _listeningForIPC = true;
  }
  if (_registrationMap[apiClassName] === undefined) {
    const methodNames: string[] = [];
    for (const methodName of getPropertyNames(mainApi)) {
      if (methodName != "constructor" && !["_", "#"].includes(methodName[0])) {
        const method = (mainApi as any)[methodName];
        if (typeof method == "function") {
          ipcMain.handle(
            toIpcName(apiClassName, methodName),
            async (_event, args: any[]) => {
              try {
                if (restorer !== undefined && args !== undefined) {
                  for (let i = 0; i < args.length; ++i) {
                    args[i] = Restorer.restoreValue(args[i], restorer);
                  }
                }
                //await before returning to keep Electron from writing errors
                const replyValue = await method.bind(mainApi)(...args);
                return Restorer.makeRestorable(replyValue);
              } catch (err: any) {
                if (err instanceof PassThroughError) {
                  return Restorer.makeReturnedError(err.errorToPass);
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
    _registrationMap[apiClassName] = methodNames;
  }

  retryUntilTimeout(
    0,
    () => {
      if (toWindow.isDestroyed()) {
        throw Error(`Window destroyed before binding to '${apiClassName}'`);
      }
      const windowApis = _boundApisByContentsID[toWindow.webContents.id];
      if (windowApis !== undefined && windowApis[apiClassName]) {
        return true;
      }
      sendApiRegistration(toWindow.webContents, apiClassName);
      return false;
    },
    `Timed out waiting for main API '${apiClassName}' to bind to window ${toWindow.id}`
  );
}

// Returns all properties of the class not defined by JavaScript.
function getPropertyNames(obj: any): string[] {
  const propertyNames: string[] = [];
  while (!Object.getOwnPropertyNames(obj).includes("hasOwnProperty")) {
    propertyNames.push(...Object.getOwnPropertyNames(obj));
    obj = Object.getPrototypeOf(obj);
  }
  return propertyNames;
}

// Send an API registration to a window.
function sendApiRegistration(toWebContents: WebContents, apiClassName: string) {
  const registration: ApiRegistration = {
    className: apiClassName,
    methodNames: _registrationMap[apiClassName],
  };
  toWebContents.send(EXPOSE_API_EVENT, registration);
}

/**
 * Receives errors thrown in APIs not wrapped in PassThroughError.
 */
export function setIpcErrorLogger(loggerFunc: (err: Error) => void): void {
  _errorLoggerFunc = loggerFunc;
}

/*
NOTE: I rejected the following more-flexible approach to exposing APIs
because it's awkward looking, which would be a barrier to adoption.
TypeScript does not (at present) provide a direct way to ensure that
every element of an array conforms to a particular structure while
also allowing the elements to have different properties. See:
https://github.com/microsoft/TypeScript/issues/7481#issuecomment-968220900
https://github.com/microsoft/TypeScript/issues/7481#issuecomment-1003504754

type CheckedApi = Record<string, (...args: any[]) => Promise<any>>;
function checkApi<T extends ElectronMainApi<T>>(api: T) {
  return api as CheckedApi;
}
class Api1 {
  async func1() {}
}
class Api2 {
  async func2() {}
}
function exposeApis(_apis: CheckedApi[]) {}
const api1 = new Api1();
const api2 = new Api2();
exposeApis([checkApi(api1), checkApi(api2)]);
*/
