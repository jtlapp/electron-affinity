import { IpcHandler, AsyncIpcHandler } from "../src/ipc_handler";
import { ResultCollector } from "./main";

class DoubleNumberIpc extends AsyncIpcHandler {
  collector: ResultCollector;

  constructor(collector: ResultCollector) {
    super("double_number");
    this.collector = collector;
  }

  async handler(n: number) {
    this.collector.setRequestData(n);
    return n * 2;
  }
}

export default function (collector: ResultCollector): IpcHandler[] {
  return [
    new DoubleNumberIpc(collector), // multiline
  ];
}
