import * as fs from "fs";

import { assertServerApi } from "../../src/ipc";
import { ResultCollector } from "../lib/main_util";
import { Catter, CustomError } from "./classes";

export const ServerApi = assertServerApi(
  class {
    _collector: ResultCollector;

    constructor(collector: ResultCollector) {
      this._collector = collector;
    }

    async noReplyNoError() {}

    async doubleNumber(x: number) {
      this._setRequestData(x);
      return x * 2;
    }

    async sumNumbers(x: number, y: number) {
      this._setRequestData(x, y);
      return x + y;
    }

    async sendCatter(catter: Catter) {
      this._setRequestData(catter);
      return catter.cat();
    }

    async makeCatter(s1: string, s2: string) {
      this._setRequestData(s1, s2);
      return new Catter(s1, s2);
    }

    async allGoodOrNot(succeed: boolean) {
      this._setRequestData(succeed);
      if (!succeed) {
        throw Error("Just a plain error");
      }
      return "all good";
    }

    async throwFSError() {
      fs.readFileSync("__nonexistant_file__");
    }

    async throwCustomError(message: string, code: number) {
      throw new CustomError(message, code);
    }

    _setRequestData(...args: any[]) {
      this._collector.setRequestData(args);
    }
  }
);
