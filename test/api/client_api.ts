import { ClientIpc } from "../../src/client_ipc";
import { Catter, recoverClass } from "./classes";

const clientIpc = new ClientIpc(recoverClass);

export class ClientApi {
  static noReplyNoError(): Promise<number> {
    return clientIpc.sendAsync("method-noReplyNoError", []);
  }

  static doubleNumber(x: number): Promise<number> {
    return clientIpc.sendAsync("method-doubleNumber", [x]);
  }

  static sumNumbers(x: number, y: number): Promise<number> {
    return clientIpc.sendAsync("method-sumNumbers", [x, y]);
  }

  static sendCatter(catter: Catter): Promise<string> {
    return clientIpc.sendAsync("method-sendCatter", [catter]);
  }

  static async makeCatter(s1: string, s2: string): Promise<Catter> {
    return clientIpc.sendAsync("method-makeCatter", [s1, s2]);
  }

  static allGoodOrNot(succeed: boolean): Promise<number> {
    return clientIpc.sendAsync("method-allGoodOrNot", [succeed]);
  }

  static throwFSError(): Promise<number> {
    return clientIpc.sendAsync("method-throwFSError");
  }

  static throwCustomError(message: string, code: number): Promise<number> {
    return clientIpc.sendAsync("method-throwCustomError", [message, code]);
  }
}
