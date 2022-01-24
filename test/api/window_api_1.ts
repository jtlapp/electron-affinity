import { TestableWindowApi } from "./testable_window_api";
import { Catter } from "../lib/shared_util";

export class WindowApi1 extends TestableWindowApi {
  sendNoParams() {
    this._reportReceivedData("win1 no params (win api1)");
  }

  sendCoordinates(x: number, y: number) {
    this._reportReceivedData("win1 multiple params (win api1)", x, y);
  }

  sendCatter(catter: Catter) {
    this._reportReceivedData("win1 restored custom class (win api1)", catter);
  }

  sendDate(date: Date) {
    this._reportReceivedData("win1 built-in type (win api1)", date);
  }

  sendFSError(err: Error) {
    this._reportReceivedData("win1 structured error (win api1)", err);
  }

  sendCustomError(err: Error) {
    this._reportReceivedData("win1 custom error (win api1)", err);
  }
}
