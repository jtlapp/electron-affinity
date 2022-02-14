import { testSend } from "../lib/renderer_util";
import { Catter } from "../lib/shared_util";

export class WinApi1 {
  _winTag: string;

  constructor(winTag: string) {
    this._winTag = winTag + " ";
  }

  sendNoParams() {
    testSend(this._winTag + "no params (win api1)", undefined);
  }

  sendStringSameMethod(s: string) {
    testSend(this._winTag + "same method (win api1)", [s]);
  }

  sendCoordinates(x: number, y: number) {
    testSend(this._winTag + "multi param (win api1)", [x, y]);
  }

  sendCatter(catter: Catter) {
    testSend(this._winTag + "send catter (win api1)", [catter]);
  }

  // TODO
  // sendDate(date: Date) {
  //   testSend("win1 built-in type (win api1)", [date]);
  // }

  // sendFSError(err: Error) {
  //   testSend("win1 structured error (win api1)", [err]);
  // }

  // sendCustomError(err: Error) {
  //   testSend("win1 custom error (win api1)", [err]);
  // }
}
