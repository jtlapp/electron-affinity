import { IpcMain } from "electron";

import { Recovery } from "./recovery";

export abstract class AsyncIpcHandler {
  channel: string;
  recoveryFunc?: Recovery.RecoveryFunction;

  constructor(channel: string, recoveryFunc?: Recovery.RecoveryFunction) {
    this.channel = channel;
    this.recoveryFunc = recoveryFunc;
  }

  register(ipcMain: IpcMain): void {
    ipcMain.handle(this.channel, async (_event, args: any[]) => {
      try {
        if (this.recoveryFunc !== undefined) {
          for (let i = 0; i < args.length; ++i) {
            args[i] = Recovery.recoverArgument(args[i], this.recoveryFunc);
          }
        }
        //await before returning to keep Electron from writing errors
        const response = await this.handler(...args);
        return Recovery.prepareArgument(response);
      } catch (err: any) {
        // TODO: I should probably provide a way to show that stack
        // trace in case it's an error requiring debugging.
        return Recovery.prepareThrownError(err);
      }
    });
  }

  abstract handler(...args: any[]): Promise<any>;
}
