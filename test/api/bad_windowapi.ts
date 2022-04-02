import {
  type ElectronWindowApi,
  exposeWindowApi,
  checkWindowApi,
  checkWindowApiClass,
} from "../../src/window";

export class BadWindowApi implements ElectronWindowApi<BadWindowApi> {
  _goodPrivateProperty1 = "foo";
  private _goodPrivateProperty2 = "foo";

  // @ts-expect-error because not a method despite being public
  publicProperty = "foo";

  returnsUnusableValue() {
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
  exposeWindowApi(new BadWindowApi());
}

// @ts-expect-error because BadMainApi is an invalid ElectronMainApi
checkWindowApiClass(BadWindowApi);
const badWindowApi = new BadWindowApi();
// @ts-expect-error because badMainApi is an invalid ElectronMainApi
checkWindowApi(badWindowApi);

// prevent unused identifier warnings
if (false) dontCall();
