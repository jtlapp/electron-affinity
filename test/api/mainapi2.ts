import { RelayedError } from "../../src/main";
import { MainApi } from "./mainapi";
import { Catter } from "../lib/shared_util";

export class MainApi2 extends MainApi {
  async sendCatter2(catter: Catter) {
    this._setRequestData(catter);
    return catter.cat();
  }

  async makeCatter2(s1: string, s2: string) {
    this._setRequestData(s1, s2);
    return new Catter(s1, s2);
  }

  async allGoodOrNot2(succeed: boolean) {
    this._setRequestData(succeed);
    if (!succeed) {
      throw new RelayedError(Error("Just a plain error"));
    }
    return "all good";
  }

  async sameMethodUniqueReply() {
    return "API 2";
  }
}
