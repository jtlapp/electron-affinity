import { MainApi } from "./mainapi";

export class MainApi3 extends MainApi {
  async throwNonRelayedError() {
    throw new Error("Expected crash");
  }
}
