import { bindMainApi } from "../../src/window";
import type { MainApi4 } from "../api/mainapi4";
import { Catter } from "../lib/shared_util";
import { testInvoke } from "../lib/renderer_util";

export async function callMainApi4(winTag: string) {
  winTag = winTag + " ";

  const mainApi4 = await bindMainApi<MainApi4>("MainApi4"); // no restorer

  await testInvoke(winTag + "class instance as object (api4)", () => {
    return mainApi4.sendClassInstanceAsObject(new Catter("this", "that"));
  });
  await testInvoke(winTag + "pass plain error (api4)", () => {
    return mainApi4.sendErrorAsArg(new Error("request error"));
  });
  await testInvoke(winTag + "rethrown plain error (api4)", () => {
    return mainApi4.throwRelayedError();
  });
}
