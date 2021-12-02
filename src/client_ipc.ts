import { ipcRenderer } from "electron";

export class ClientIpc {
  static async sendAsync(channel: string, request?: any): Promise<any> {
    const response = await ipcRenderer.invoke(channel, request);
    if (response.__eipc_error) {
      const err = new Error(response.message);
      delete response.__epic_class;
      delete response.message;
      Object.assign(err, response);
      throw err;
    }
    return response;
  }
}
