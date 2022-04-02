import { ElectronWindowApi, checkWindowApiClass } from "../../src/window";
import { testSend } from "../lib/renderer_util";
import { Catter, assertIdentical } from "../lib/shared_util";

export class WinApi1 implements ElectronWindowApi<WinApi1> {
  private winTag: string; // test private property without prefix

  _unused = "for testing compilation";

  constructor(winTag: string) {
    this.winTag = winTag + " ";
  }

  // also ensures it's not a problem for window APIs to be async
  async sendNoParams() {
    testSend(this.winTag + "no params (win api1)", () => [""]);
  }

  sendStringSameMethod(s: string) {
    testSend(this.winTag + "same method (win api1)", () => [s]);
    return s; // return value should not make it into the bound API
  }

  sendCoordinates(x: number, y: number) {
    testSend(this.winTag + "multi param (win api1)", () => [
      x.toString(),
      y.toString(),
    ]);
  }

  sendCatter(catter: Catter) {
    testSend(this.winTag + "send catter (win api1)", () => {
      const results: string[] = [];
      results.push((catter instanceof Catter).toString());
      results.push(catter.s1);
      results.push(catter.s2);
      return results;
    });
  }

  sendNull(value: any) {
    testSend(this.winTag + "null (win api1)", () => [
      value === null ? "null" : "nope",
    ]);
  }

  sendTrue(value: any) {
    testSend(this.winTag + "boolean (win api1)", () => [
      value === true ? "true" : "nope",
    ]);
  }

  sendDate(date: Date) {
    testSend(this.winTag + "built-in type (win api1)", () => [date.toString()]);
  }

  sendArray(value: any) {
    testSend(this.winTag + "array (win api1)", () => [value.toString()]);
  }

  sendFSError(err: Error) {
    testSend(this.winTag + "structured error (win api1)", () => {
      const expectedMessage = "ENOENT: no such file or directory";
      const results: string[] = [];
      results.push((err instanceof Error).toString());
      results.push(err.message.substring(0, expectedMessage.length));
      // Electron strips the error code and stack.
      return results;
    });
  }

  sendCustomError(err: Error) {
    testSend(this.winTag + "custom error (win api1)", () => {
      const results: string[] = [];
      results.push((err instanceof Error).toString());
      results.push(err.message);
      // Electron strips the error code and stack.
      return results;
    });
  }
}

assertIdentical(WinApi1, checkWindowApiClass(WinApi1));
