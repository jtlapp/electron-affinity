import { TestableMainApi } from "./testable_mainapi";

export class MainApi3 extends TestableMainApi {
  async throwNonRelayedError() {
    throw new Error("Expected crash");
  }
}
