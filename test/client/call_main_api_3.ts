import { bindMainApi } from "../../src/window";
import type { MainApi3 } from "../api/main_api_3";
import { testInvoke } from "../lib/renderer_util";

export async function callMainApi3(winTag: string) {
  winTag = winTag + " ";

  const mainApi3 = await bindMainApi<MainApi3>("MainApi3");

  await testInvoke(winTag + "unwrapped error (api3)", () => {
    return mainApi3.throwUnwrappedError();
  });
}
