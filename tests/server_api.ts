import { IpcHandler, AsyncIpcHandler } from "../src/ipc_handler";
import { ScriptRunner } from "./main";

class DoubleNumberIpc extends AsyncIpcHandler {
  runner: ScriptRunner;

  constructor(runner: ScriptRunner) {
    super("double_number");
    this.runner = runner;
  }

  async handler(n: number) {
    this.runner.setRequestData(n);
    return n * 2;
  }
}

export default function (runner: ScriptRunner): IpcHandler[] {
  return [
    new DoubleNumberIpc(runner), // multiline
  ];
}
