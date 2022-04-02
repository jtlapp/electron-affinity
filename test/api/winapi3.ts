import { ElectronWindowApi } from "../../src/window";

import { testSend } from "../lib/renderer_util";
import { Catter } from "../lib/shared_util";

export class WinApi3 implements ElectronWindowApi<WinApi3> {
  __winTag: string; // test private property with double prefix

  constructor(winTag: string) {
    this.__winTag = winTag + " ";
  }

  sendClassInstanceAsObject(catter: any) {
    testSend(this.__winTag + "class instance as object (win api3)", () => {
      const results: string[] = [];
      results.push((catter instanceof Catter).toString());
      results.push(catter.s1);
      results.push(catter.s2);
      return results;
    });
  }

  sendErrorAsArg(err: any) {
    testSend(this.__winTag + "error as arg (win api3)", () => {
      const expectedMessage = "restored error";
      const results: string[] = [];
      results.push((err instanceof Error).toString());
      results.push(err.message.substring(0, expectedMessage.length));
      // Electron strips the error code and stack.
      return results;
    });
  }
}
