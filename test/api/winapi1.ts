import { testSend } from "../lib/renderer_util";
import { Catter } from "../lib/shared_util";

export class WinApi1 {
  private _winTag: string;

  constructor(winTag: string) {
    this._winTag = winTag + " ";
  }

  sendNoParams() {
    testSend(this._winTag + "no params (win api1)", () => [""]);
  }

  sendStringSameMethod(s: string) {
    testSend(this._winTag + "same method (win api1)", () => [s]);
  }

  sendCoordinates(x: number, y: number) {
    testSend(this._winTag + "multi param (win api1)", () => [
      x.toString(),
      y.toString(),
    ]);
  }

  sendCatter(catter: Catter) {
    testSend(this._winTag + "send catter (win api1)", () => {
      const results: string[] = [];
      results.push((catter instanceof Catter).toString());
      results.push(catter.s1);
      results.push(catter.s2);
      return results;
    });
  }

  sendNull(value: any) {
    testSend(this._winTag + "null (win api1)", () => [
      value === null ? "null" : "nope",
    ]);
  }

  sendTrue(value: any) {
    testSend(this._winTag + "boolean (win api1)", () => [
      value === true ? "true" : "nope",
    ]);
  }

  sendDate(date: Date) {
    testSend(this._winTag + "built-in type (win api1)", () => [
      date.toString(),
    ]);
  }

  sendArray(value: any) {
    testSend(this._winTag + "array (win api1)", () => [value.toString()]);
  }

  sendFSError(err: Error) {
    testSend(this._winTag + "structured error (win api1)", () => {
      const expectedMessage = "ENOENT: no such file or directory";
      const results: string[] = [];
      results.push((err instanceof Error).toString());
      results.push(err.message.substring(0, expectedMessage.length));
      // Electron strips the error code and stack.
      return results;
    });
  }

  sendCustomError(err: Error) {
    testSend(this._winTag + "custom error (win api1)", () => {
      const results: string[] = [];
      results.push((err instanceof Error).toString());
      results.push(err.message);
      // Electron strips the error code and stack.
      return results;
    });
  }
}
