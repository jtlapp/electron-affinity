import "source-map-support/register";

import { exposeMainApi, setIpcBindingTimeout } from "../../src/main";
import { ACCEPTABLE_DELAY_MILLIS } from "../lib/config";
import { createWindow, createResultCollector } from "../lib/main_util";
import { MainApi2 } from "../api/mainapi2";
import { restorer } from "../lib/shared_util";
import { sleep } from "../lib/shared_util";

const resultCollector = createResultCollector(restorer);
const mainApi2 = new MainApi2(resultCollector);

it("waits for main to timeout", async () => {
  const window1 = await createWindow();
  // Arrange for window to bind too late, after main times out
  setIpcBindingTimeout(ACCEPTABLE_DELAY_MILLIS * 0.5);
  exposeMainApi(window1, mainApi2, restorer);
  // Use 'win1_mainapi2_delayed.ts' to provide confidence that the test that
  // attempts to successfully run succeeds on sufficiently long timeout.
  await resultCollector.runScripFiletInWindow(window1, "win1_mainapi2_delayed");
  await sleep(ACCEPTABLE_DELAY_MILLIS * 1.2);
  if (window1) window1.destroy();
});
