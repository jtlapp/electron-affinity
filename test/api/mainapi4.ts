import { ElectronMainApi, RelayedError } from "../../src/main";

import { MainApi } from "./mainapi";
import { Catter } from "../lib/shared_util";

export class MainApi4 extends MainApi implements ElectronMainApi<MainApi4> {
  async sendClassInstanceAsObject(catterAsObject: any) {
    this._setRequestData(catterAsObject);
    return new Catter("foo", "bar");
  }

  async sendErrorAsArg(errorAsObject: any) {
    this._setRequestData(errorAsObject);
    return new Error("reply error");
  }

  async throwRelayedError() {
    throw new RelayedError(Error("thrown error"));
  }
}
