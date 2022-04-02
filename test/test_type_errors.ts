/**
 * Tests for expected type errors at compile time.
 */

import { bindMainApi } from "../src/window";
import { bindWindowApi } from "../src/main";

import type { BadMainApi } from "./api/bad_mainapi";
import type { BadWindowApi } from "./api/bad_windowapi";

const test = it;

async function checkWindowClientOfMain() {
  // @ts-expect-error because the API is not a valid main API
  const boundMainApi = await bindMainApi<BadMainApi>("BadMainApi");

  // @ts-expect-error because method does not return a promise
  await takesMainMethod(boundMainApi.syncMethod);

  // @ts-expect-error because method does not exist
  boundMainApi.notThere();

  // @ts-expect-error to ensure invalid property wasn't turned into a method
  boundMainApi.publicProperty();

  // @ts-expect-error because bindings should not include private properties
  boundMainApi._goodPrivateProperty;
  // @ts-expect-error because bindings should not include private properties
  boundMainApi.tsPrivateProperty;
  // @ts-expect-error because bindings should not include private properties
  boundMainApi.tsPrivateMethod();
}

async function checkMainClientOfWindow() {
  // @ts-expect-error because the API is not a valid window API
  const boundWindowApi = await bindWindowApi<BadWindowApi>(
    {} as any,
    "BadWindowApi"
  );

  // @ts-expect-error because method does not exist
  await boundWindowApi.notThere();

  // @ts-expect-error to ensure invalid property wasn't turned into a method
  boundWindowApi.publicProperty();

  // @ts-expect-error because client does not receive return values
  takesString(boundWindowApi.returnsUnusableValue());
  // @ts-expect-error because client does not receive return values
  takesStringPromise(boundWindowApi.returnsUnusableValue());

  // @ts-expect-error because bindings should not include private properties
  boundWindowApi._goodPrivateProperty;
  // @ts-expect-error because bindings should not include private properties
  boundWindowApi.tsPrivateProperty;
  // @ts-expect-error because bindings should not include private properties
  boundWindowApi.tsPrivateMethod();
}

async function takesMainMethod(method: (...args: any[]) => Promise<any>) {
  await method();
}
function takesString(s: string) {
  console.log(s);
}
async function takesStringPromise(sp: Promise<string>) {
  console.log(await sp);
}

test("compiler produces expected type errors", () => {
  // prevent unused identifier warnings
  if (false) checkWindowClientOfMain();
  if (false) checkMainClientOfWindow();
});
