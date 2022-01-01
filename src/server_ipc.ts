import { ipcMain, BrowserWindow } from "electron";

import {
  EXPOSE_API_EVENT,
  BOUND_API_EVENT,
  ApiRegistration,
  ApiRegistrationMap,
  PublicProperty,
  toIpcName,
  retryUntilTimeout,
} from "./shared_ipc";
import { Recovery } from "./recovery";

let _registrationMap: ApiRegistrationMap = {};
let _boundApis: Record<string, boolean> = {};
let _awaitBindingTimeoutMillis = 500;

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
  serverApi: ElectronMainApi<T>,
  recoveryFunc?: Recovery.RecoveryFunction
) {
  const apiClassName = serverApi.constructor.name;
  if (Object.keys(_registrationMap).length == 0) {
    ipcMain.on(BOUND_API_EVENT, (_event, boundApiName: string) => {
      _boundApis[boundApiName] = true;
    });
  }
  if (_registrationMap[apiClassName] === undefined) {
    const methodNames: string[] = [];
    for (const methodName in serverApi) {
      if (methodName[0] != "_" && methodName[0] != "#") {
        const method = serverApi[methodName];
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
                // TODO: combine the next two lines
                const response = await method.bind(serverApi)(...args);
                return Recovery.prepareArgument(response);
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
  // TODO: test this
  retryUntilTimeout(
    0,
    () => {
      if (_boundApis[apiClassName]) {
        return true;
      }
      toWindow.webContents.send(EXPOSE_API_EVENT, {
        className: apiClassName,
        methodNames: _registrationMap[apiClassName],
      } as ApiRegistration);
      return false;
    },
    _awaitBindingTimeoutMillis,
    `Timed out waiting for bound IPC API '${apiClassName}'`
  );
}

let _errorLoggerFunc: (err: Error) => void;

export function setIpcErrorLogger(loggerFunc: (err: Error) => void) {
  _errorLoggerFunc = loggerFunc;
}
