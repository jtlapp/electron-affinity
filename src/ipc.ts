import { ipcMain } from "electron";

import { Recovery } from "./recovery";

let errorLoggerFunc: (err: Error) => void;

export function setIpcErrorLogger(loggerFunc: (err: Error) => void) {
  errorLoggerFunc = loggerFunc;
}

type PrivateProperty<P> = P extends `_${string}`
  ? P
  : P extends `#${string}`
  ? P
  : never;
type PublicProperty<P> = P extends PrivateProperty<P>
  ? never
  : P extends string
  ? P
  : never;

type InvokeApi<T> = {
  [K in keyof T]: K extends PublicProperty<K>
    ? (...args: any[]) => Promise<any>
    : any;
};

type InvokeApiClass<T extends InvokeApi<T>> = {
  new (...args: [any]): T;
};

export function assertServerApi<T extends InvokeApi<T>>(
  serverApiClass: InvokeApiClass<T>
) {
  return serverApiClass;
}

export function registerServerApi<T extends InvokeApi<T>>(
  serverApi: T,
  recoveryFunc?: Recovery.RecoveryFunction
) {
  for (const methodName in serverApi) {
    if (methodName[0] != "_" && methodName[0] != "#") {
      const method = serverApi[methodName];
      if (typeof method == "function") {
        ipcMain.handle("method-" + methodName, async (_event, args: any[]) => {
          try {
            if (recoveryFunc !== undefined && args !== undefined) {
              for (let i = 0; i < args.length; ++i) {
                args[i] = Recovery.recoverArgument(args[i], recoveryFunc);
              }
            }
            //await before returning to keep Electron from writing errors
            const response = await method.bind(serverApi)(...args);
            return Recovery.prepareArgument(response);
          } catch (err: any) {
            if (errorLoggerFunc !== undefined) {
              errorLoggerFunc(err);
            }
            return Recovery.prepareThrownError(err);
          }
        });
      }
    }
  }
}
