import { IpcMain } from "electron";

export abstract class AsyncIpcHandler {
  channel: string;

  constructor(channel: string) {
    this.channel = channel;
  }

  register(ipcMain: IpcMain): void {
    ipcMain.handle(this.channel, async (_event, args: any[]) => {
      try {
        //await before returning to keep Electron from writing errors
        const response = await this.handler(...args);
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

  abstract handler(...args: any[]): Promise<any>;
}
