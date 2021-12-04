import * as fs from "fs";
import { AsyncIpcHandler } from "../../src/ipc_handler";
import { ResultCollector } from "../lib/main_util";
import { recoverClass, Catter, CustomError } from "./classes";

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

class SendCatterIpc extends AsyncIpcHandler {
  collector: ResultCollector;

  constructor(collector: ResultCollector) {
    super("send_catter", recoverClass);
    this.collector = collector;
  }

  async handler(catter: Catter) {
    this.collector.setRequestData([catter]);
    return catter.cat();
  }
}

class MakeCatterIpc extends AsyncIpcHandler {
  collector: ResultCollector;

  constructor(collector: ResultCollector) {
    super("make_catter", recoverClass);
    this.collector = collector;
  }

  async handler(s1: string, s2: string) {
    this.collector.setRequestData([s1, s2]);
    return new Catter(s1, s2);
  }
}

class ThrowPlainErrorIpc extends AsyncIpcHandler {
  collector: ResultCollector;

  constructor(collector: ResultCollector) {
    super("throw_plain_error");
    this.collector = collector;
  }

  async handler() {
    throw Error("Just a plain error");
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

class ThrowCustomErrorIpc extends AsyncIpcHandler {
  collector: ResultCollector;

  constructor(collector: ResultCollector) {
    super("throw_custom_error");
    this.collector = collector;
  }

  async handler(message: string, code: number) {
    throw new CustomError(message, code);
  }
}

export default function (collector: ResultCollector): AsyncIpcHandler[] {
  return [
    new DoubleNumberIpc(collector), // multiline
    new SumNumbersIpc(collector),
    new SendCatterIpc(collector),
    new MakeCatterIpc(collector),
    new ThrowPlainErrorIpc(collector),
    new ThrowFSErrorIpc(collector),
    new ThrowCustomErrorIpc(collector),
  ];
}

// class CustomError extends Error {
//   code: number;

//   constructor(message: string) {
//     super(message);
//     this.code = 1001;
//   }
// }
