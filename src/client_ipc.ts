import { ipcRenderer } from "electron";

import { Recovery } from "./recovery";

export class ClientIpc {
  recoveryFunc?: Recovery.RecoveryFunction;

  constructor(recoveryFunc?: Recovery.RecoveryFunction) {
    this.recoveryFunc = recoveryFunc;
  }

  async sendAsync(channel: string, args?: any[]): Promise<any> {
    if (args !== undefined) {
      for (const arg of args) {
        Recovery.prepareArgument(arg);
      }
    }
    let response = await ipcRenderer.invoke(channel, args);
    if (Recovery.wasThrownError(response)) {
      throw Recovery.recoverThrownError(response, this.recoveryFunc);
    }
    return Recovery.recoverArgument(response, this.recoveryFunc);
  }
}
