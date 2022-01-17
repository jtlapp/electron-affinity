import * as fs from "fs";

import { PassThroughError } from "../../src/main";
import { TestableApi } from "./testable_api";
import { Catter, CustomError } from "../lib/shared_util";

export class MainApi1 extends TestableApi {
  async noReplyNoError() {}

  async doubleNumber(x: number) {
    this._setRequestData(x);
    return x * 2;
  }

  async sumNumbers(x: number, y: number) {
    this._setRequestData(x, y);
    return x + y;
  }

  async sendCatter1(catter: Catter) {
    this._setRequestData(catter);
    return catter.cat();
  }

  async makeCatter1(s1: string, s2: string) {
    this._setRequestData(s1, s2);
    return new Catter(s1, s2);
  }

  async allGoodOrNot1(succeed: boolean) {
    this._setRequestData(succeed);
    if (!succeed) {
      throw new PassThroughError(Error("Just a plain error"));
    }
    return "all good";
  }

  async sameMethodUniqueReply() {
    return "API 1";
  }

  async throwFSError() {
    try {
      fs.readFileSync("__nonexistant_file__");
    } catch (err: any) {
      throw new PassThroughError(err);
    }
  }

  async throwCustomError(message: string, code: number) {
    throw new PassThroughError(new CustomError(message, code));
  }
}
