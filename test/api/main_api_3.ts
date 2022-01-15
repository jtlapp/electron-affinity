import { TestableApi } from "./testable_api";

export class MainApi3 extends TestableApi {
  async throwUnwrappedError() {
    throw new Error("Expected crash");
  }
}
