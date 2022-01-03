import "source-map-support/register";

import { exposeMainApi, setIpcBindingTimeout } from "../../src";
import { WINDOW_INITIAL_DELAY_MILLIS } from "../lib/config";
import { createWindow, createResultCollector } from "../lib/main_util";
import { MainApi2 } from "../api/main_api_2";
import { recoverer } from "../lib/shared_util";

const resultCollector = createResultCollector(recoverer);
const mainApi2 = new MainApi2(resultCollector);

it("waits for main to timeout", async () => {
  const window1 = await createWindow();
  // Arrange for window to bind too late, after main times out
  setIpcBindingTimeout(WINDOW_INITIAL_DELAY_MILLIS / 2);
  exposeMainApi(window1, mainApi2, recoverer);
  // Use 'win1_api_2_delayed.ts' to provide confidence that the test that
  // attempts to successfully run succeeds on sufficiently long timeout.
  await resultCollector.runScriptInWindow(window1, "win1_api_2_delayed");
  await resultCollector.waitForResults();
  if (window1) window1.destroy();
});
