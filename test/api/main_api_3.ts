import { TestableApi } from "./testable_api";

export class MainApi3 extends TestableApi {
  async throwNonRelayedError() {
    throw new Error("Expected crash");
  }
}
