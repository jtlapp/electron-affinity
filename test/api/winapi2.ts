import { testSend } from "../lib/renderer_util";
import { Catter } from "../lib/shared_util";

export class WinApi2 {
  _winTag: string;

  constructor(winTag: string) {
    this._winTag = winTag + " ";
  }

  sendStringSameMethod(s: string) {
    testSend(this._winTag + "same method (win api2)", [s]);
  }

  sendCatter2(catter: Catter) {
    testSend(this._winTag + "send catter (win api2)", [catter]);
  }

  // TODO
  // sendFSError(err: Error) {
  //   testSend("win1 structured error (win api1)", [err]);
  // }
}
