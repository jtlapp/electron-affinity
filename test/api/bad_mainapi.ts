import {
  type ElectronMainApi,
  exposeMainApi,
  checkMainApi,
  checkMainApiClass,
} from "../../src/main";

export class BadMainApi implements ElectronMainApi<BadMainApi> {
  _goodPrivateProperty1 = "foo";
  private _goodPrivateProperty2 = "foo";

  // @ts-expect-error because not a method despite being public
  publicProperty = "foo";

  // @ts-expect-error because method is not async
  syncMethod(): string {
    return "foo";
  }

  async preventUnusedErrors() {
    // prevents unused identifier warnings
    return (
      this._goodPrivateProperty1 +
      this._goodPrivateProperty2 +
      this.tsPrivateProperty +
      this.tsPrivateMethod()
    );
  }

  // TypeScript-private methods are ignored
  private tsPrivateProperty = "foo";
  private tsPrivateMethod() {
    return "foo";
  }
}

async function dontCall() {
  // @ts-expect-error because API is not compliant
  exposeMainApi(new BadMainApi());
}

// @ts-expect-error because BadMainApi is an invalid ElectronMainApi
checkMainApiClass(BadMainApi);
const badMainApi = new BadMainApi();
// @ts-expect-error because badMainApi is an invalid ElectronMainApi
checkMainApi(badMainApi);

// prevent unused identifier warnings
if (false) dontCall();
