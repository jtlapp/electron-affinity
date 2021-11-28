import { IpcHandler, SyncIpcHandler } from "../src/ipc_handler";

class DoubleNumberIpc extends SyncIpcHandler {
  constructor() {
    super("double_number");
  }

  handler(n: number) {
    return n * 2;
  }
}

export default function (): IpcHandler[] {
  return [
    new DoubleNumberIpc(), // multiline
  ];
}
