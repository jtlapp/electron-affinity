import { ElectronWindowApi } from "../../src/window";

import { testSend } from "../lib/renderer_util";
import { Catter } from "../lib/shared_util";

export class WinApi2 implements ElectronWindowApi<WinApi2> {
  _winTag: string;

  constructor(winTag: string) {
    this._winTag = winTag + " ";
  }

  sendStringSameMethod(s: string) {
    testSend(this._winTag + "same method (win api2)", () => [s]);
  }

  sendCatter2(catter: Catter) {
    testSend(this._winTag + "send catter (win api2)", () => {
      const results: string[] = [];
      results.push((catter instanceof Catter).toString());
      results.push(catter.s1);
      results.push(catter.s2);
      return results;
    });
  }
}
