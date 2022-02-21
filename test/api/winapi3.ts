import { testSend } from "../lib/renderer_util";
import { Catter } from "../lib/shared_util";

export class WinApi3 {
  _winTag: string;

  constructor(winTag: string) {
    this._winTag = winTag + " ";
  }

  sendClassInstanceAsObject(catter: any) {
    testSend(this._winTag + "class instance as object (win api3)", () => {
      const results: string[] = [];
      results.push((catter instanceof Catter).toString());
      results.push(catter.s1);
      results.push(catter.s2);
      return results;
    });
  }

  sendErrorAsArg(err: any) {
    testSend(this._winTag + "error as arg (win api3)", () => {
      const expectedMessage = "restored error";
      const results: string[] = [];
      results.push((err instanceof Error).toString());
      results.push(err.message.substring(0, expectedMessage.length));
      // Electron strips the error code and stack.
      return results;
    });
  }
}
