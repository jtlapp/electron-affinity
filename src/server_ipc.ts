import { ipcMain, BrowserWindow } from "electron";

import {
  EXPOSE_API_EVENT,
  ApiRegistration,
  ApiRegistrationMap,
  PublicProperty,
  ReturnsPromise,
  toIpcName,
} from "./shared_ipc";
import { Recovery } from "./recovery";

let _registrationMap: ApiRegistrationMap = {};

export type ServerInvokeApi<T> = {
  [K in keyof T]: K extends PublicProperty<K> ? ReturnsPromise<T[K]> : any;
};

export function exposeServerApi<T extends ServerInvokeApi<T>>(
  toWindow: BrowserWindow,
  serverApi: T,
  recoveryFunc?: Recovery.RecoveryFunction
) {
  const apiClassName = serverApi.constructor.name;
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
  toWindow.webContents.send(EXPOSE_API_EVENT, {
    className: apiClassName,
    methodNames: _registrationMap[apiClassName],
  } as ApiRegistration);
}

let _errorLoggerFunc: (err: Error) => void;

export function setIpcErrorLogger(loggerFunc: (err: Error) => void) {
  _errorLoggerFunc = loggerFunc;
}
