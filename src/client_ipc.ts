import { ipcRenderer } from "electron";

export class ClientIpc {
  static async sendAsync(channel: string, request?: any): Promise<any> {
    const response = await ipcRenderer.invoke(channel, request);
    if (response instanceof Error) throw response;
    return response;
  }

  static sendSync(channel: string, request?: any): any {
    const response = ipcRenderer.sendSync(channel, request);
    if (response instanceof Error) throw Error;
    return response;
  }
}
