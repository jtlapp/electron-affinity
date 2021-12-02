import { ClientIpc } from "../../src/client_ipc";

export class ClientApi {
  static doubleNumber(n: number): Promise<number> {
    return ClientIpc.sendAsync("double_number", n);
  }

  static throwFSError(): Promise<number> {
    return ClientIpc.sendAsync("throw_fs_error");
  }
}
