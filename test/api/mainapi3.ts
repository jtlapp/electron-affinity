import { RelayedError } from "../../src/main";

import { MainApi } from "./mainapi";

export class MainApi3 extends MainApi {
  async throwNonRelayedError() {
    throw new Error("API exception");
  }

  async returnRelayedError() {
    return new RelayedError(Error("oops"));
  }
}
