import { ipcMain, BrowserWindow } from "electron";

import {
  EXPOSE_API_EVENT,
  BOUND_API_EVENT,
  ApiRegistration,
  ApiRegistrationMap,
  ApiBinding,
  PublicProperty,
  toIpcName,
  retryUntilTimeout,
} from "./shared_ipc";
import { Recovery } from "./recovery";
// Use the publicly-exposed RecoveryFunction type
import { RecoveryFunction } from "./index";

let _registrationMap: ApiRegistrationMap = {};
let _boundApisByWindowID: Record<number, Record<string, boolean>> = {};

export type ElectronMainApi<T> = {
  [K in keyof T]: K extends PublicProperty<K>
    ? (...args: any[]) => Promise<any>
    : any;
};

/*
I rejected the following more-flexible approach to exposing APIs
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

export function exposeMainApi<T>(
  toWindow: BrowserWindow,
  mainApi: ElectronMainApi<T>,
  recoveryFunc?: RecoveryFunction
) {
  const apiClassName = mainApi.constructor.name;
  if (Object.keys(_registrationMap).length == 0) {
    ipcMain.on(BOUND_API_EVENT, (_event, binding: ApiBinding) => {
      let windowApis = _boundApisByWindowID[binding.windowID];
      if (windowApis === undefined) {
        windowApis = {};
        _boundApisByWindowID[binding.windowID] = windowApis;
      }
      windowApis[binding.className] = true;
    });
  }
  if (_registrationMap[apiClassName] === undefined) {
    const methodNames: string[] = [];
    for (const methodName in mainApi) {
      if (methodName[0] != "_" && methodName[0] != "#") {
        const method = mainApi[methodName];
        if (typeof method == "function") {
          ipcMain.handle(
            toIpcName(apiClassName, methodName),
            async (_event, args: any[]) => {
              try {
                if (recoveryFunc !== undefined && args !== undefined) {
                  for (let i = 0; i < args.length; ++i) {
                    args[i] = Recovery.recoverArgument(args[i], recoveryFunc);
                  }
                }
                //await before returning to keep Electron from writing errors
                const replyValue = await method.bind(mainApi)(...args);
                return Recovery.prepareArgument(replyValue);
              } catch (err: any) {
                if (_errorLoggerFunc !== undefined) {
                  _errorLoggerFunc(err);
                }
                return Recovery.prepareThrownError(err);
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
      const windowApis = _boundApisByWindowID[toWindow.id];
      if (windowApis !== undefined && windowApis[apiClassName]) {
        return true;
      }
      const registration: ApiRegistration = {
        windowID: toWindow.id,
        className: apiClassName,
        methodNames: _registrationMap[apiClassName],
      };
      toWindow.webContents.send(EXPOSE_API_EVENT, registration);
      return false;
    },
    `Timed out waiting for main API '${apiClassName}' to bind to window ${toWindow.id}`
  );
}

let _errorLoggerFunc: (err: Error) => void;

export function setIpcErrorLogger(loggerFunc: (err: Error) => void) {
  _errorLoggerFunc = loggerFunc;
}
