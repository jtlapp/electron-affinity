import { ClientIpc } from "../../src/client_ipc";
import { Catter, recoverClass } from "./classes";

const clientIpc = new ClientIpc(recoverClass);

export class ClientApi {
  static noReplyNoError(): Promise<number> {
    return clientIpc.sendAsync("no_reply_no_error", []);
  }

  static doubleNumber(x: number): Promise<number> {
    return clientIpc.sendAsync("double_number", [x]);
  }

  static sumNumbers(x: number, y: number): Promise<number> {
    return clientIpc.sendAsync("sum_numbers", [x, y]);
  }

  static sendCatter(catter: Catter): Promise<string> {
    return clientIpc.sendAsync("send_catter", [catter]);
  }

  static async makeCatter(s1: string, s2: string): Promise<Catter> {
    return clientIpc.sendAsync("make_catter", [s1, s2]);
  }

  static throwPlainError(): Promise<number> {
    return clientIpc.sendAsync("throw_plain_error");
  }

  static throwFSError(): Promise<number> {
    return clientIpc.sendAsync("throw_fs_error");
  }

  static throwCustomError(message: string, code: number): Promise<number> {
    return clientIpc.sendAsync("throw_custom_error", [message, code]);
  }
}
