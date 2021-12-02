import { AsyncIpcHandler } from "../../src/ipc_handler";
import { ResultCollector } from "../lib/main_util";
import * as fs from "fs";

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

class ThrowFSErrorIpc extends AsyncIpcHandler {
  collector: ResultCollector;

  constructor(collector: ResultCollector) {
    super("throw_fs_error");
    this.collector = collector;
  }

  async handler() {
    fs.readFileSync("__nonexistant__.txt");
  }
}

export default function (collector: ResultCollector): AsyncIpcHandler[] {
  return [
    new DoubleNumberIpc(collector), // multiline
    new ThrowFSErrorIpc(collector),
  ];
}

// class CustomError extends Error {
//   code: number;

//   constructor(message: string) {
//     super(message);
//     this.code = 1001;
//   }
// }
