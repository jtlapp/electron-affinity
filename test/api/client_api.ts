import { ClientIpc } from "../../src/client_ipc";

export class ClientApi {
  static doubleNumber(x: number): Promise<number> {
    return ClientIpc.sendAsync("double_number", [x]);
  }

  static sumNumbers(x: number, y: number): Promise<number> {
    return ClientIpc.sendAsync("sum_numbers", [x, y]);
  }

  static throwFSError(): Promise<number> {
    return ClientIpc.sendAsync("throw_fs_error");
  }
}
