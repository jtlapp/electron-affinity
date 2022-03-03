import { ElectronMainApi, RelayedError } from "../../src/main";

import { MainApi } from "./mainapi";

export class MainApi3 extends MainApi implements ElectronMainApi<MainApi3> {
  async throwNonRelayedError() {
    throw new Error("API exception");
  }

  async returnRelayedError() {
    return new RelayedError(Error("oops"));
  }
}
