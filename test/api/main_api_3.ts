import { TestableMainApi } from "./testable_main_api";

export class MainApi3 extends TestableMainApi {
  async throwNonRelayedError() {
    throw new Error("Expected crash");
  }
}
