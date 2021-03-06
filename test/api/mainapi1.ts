import * as fs from "fs";

import {
  ElectronMainApi,
  RelayedError,
  checkMainApiClass,
} from "../../src/main";
import { MainApi } from "./mainapi";
import {
  Catter,
  CustomError,
  NoMessageError,
  NonErrorObject,
  assertIdentical,
} from "../lib/shared_util";

export class MainApi1 extends MainApi implements ElectronMainApi<MainApi1> {
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
      throw new RelayedError(Error("Just a plain error"));
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
      throw new RelayedError(err);
    }
  }

  async throwCustomError(message: string, code: number) {
    throw new RelayedError(new CustomError(message, code));
  }

  async throwStringError() {
    throw new RelayedError("error string");
  }

  async throwNoMessageError() {
    throw new RelayedError(new NoMessageError());
  }

  async throwNonErrorObject() {
    throw new RelayedError(new NonErrorObject("bad"));
  }

  async throwNonRestoredCustomError() {
    throw new RelayedError(new NonRestoredCustomError());
  }
}

class NonRestoredCustomError extends Error {
  constructor() {
    super("non-restored");
  }
}

assertIdentical(MainApi1, checkMainApiClass(MainApi1));
