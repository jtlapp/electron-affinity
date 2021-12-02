import { AsyncIpcHandler } from "../../src/ipc_handler";
import { ResultCollector } from "../lib/main_util";
import * as fs from "fs";

class DoubleNumberIpc extends AsyncIpcHandler {
  collector: ResultCollector;

  constructor(collector: ResultCollector) {
    super("double_number");
    this.collector = collector;
  }

  async handler(x: number) {
    this.collector.setRequestData([x]);
    return x * 2;
  }
}

class SumNumbersIpc extends AsyncIpcHandler {
  collector: ResultCollector;

  constructor(collector: ResultCollector) {
    super("sum_numbers");
    this.collector = collector;
  }

  async handler(x: number, y: number) {
    this.collector.setRequestData([x, y]);
    return x + y;
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
    new SumNumbersIpc(collector),
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
