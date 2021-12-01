import { IpcMain } from "electron";

export abstract class IpcHandler {
  channel: string;

  constructor(channel: string) {
    this.channel = channel;
  }

  abstract register(ipcMain: IpcMain): void;
}

export abstract class AsyncIpcHandler extends IpcHandler {
  constructor(channel: string) {
    super(channel);
  }

  register(ipcMain: IpcMain): void {
    ipcMain.handle(this.channel, async (_event, request) => {
      try {
        //await before returning to keep Electron from writing errors
        const response = await this.handler(request);
        return response;
      } catch (err: any) {
        // Electron will throw an instance of Error either thrown from
        // here or returned from here, but that instance will only carry
        // the message property and no other properties. In order to
        // retain the error properties, I have to return an object that
        // is not an instance of error. However, I'm intentionally not
        // preserving the stack trace for use by the client.

        // TODO: I should probably provide a way to show that stack
        // trace in case it's an error requiring debugging.
        return Object.assign(
          {
            __eipc_error: true,
            __epic_class: err.constructor.name,
            message: err.message,
          },
          err
        );
      }
    });
  }

  abstract handler(request: any): Promise<any>;
}

export abstract class SyncIpcHandler extends IpcHandler {
  constructor(channel: string) {
    super(channel);
  }

  register(ipcMain: IpcMain): void {
    ipcMain.on(this.channel, (event, request) => {
      event.returnValue = this.handler(request);
    });
  }

  abstract handler(request: any): any;
}
