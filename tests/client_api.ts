import { ClientIpc } from "../src/client_ipc";

export class ClientApi {
  static doubleNumber(n: number): number {
    return ClientIpc.sendSync("double_number", n);
  }
}
