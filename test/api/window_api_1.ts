import { TestableWindowApi } from "./testable_window_api";
import { testSend } from "../lib/renderer_util";
import { Catter } from "../lib/shared_util";

export class WindowApi1 extends TestableWindowApi {
  sendNoParams() {
    testSend("win1 no params (win api1)", undefined);
  }

  sendCoordinates(x: number, y: number) {
    testSend("win1 multi param (win api1)", [x, y]);
  }

  sendCatter(catter: Catter) {
    testSend("win1 send class instance (win api1)", [catter]);
  }

  sendDate(date: Date) {
    testSend("win1 built-in type (win api1)", [date]);
  }

  sendFSError(err: Error) {
    testSend("win1 structured error (win api1)", [err]);
  }

  sendCustomError(err: Error) {
    testSend("win1 custom error (win api1)", [err]);
  }
}
