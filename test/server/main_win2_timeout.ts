import "source-map-support/register";

import { exposeMainApi, setIpcBindingTimeout } from "../../src/main";
import { ACCEPTABLE_DELAY_MILLIS } from "../lib/config";
import { createWindow, createResultCollector } from "../lib/main_util";
import { MainApi2 } from "../api/main_api_2";
import { restorer } from "../lib/shared_util";
import { sleep } from "../lib/shared_util";

const resultCollector = createResultCollector(restorer);
const mainApi2 = new MainApi2(resultCollector);

it("waits for main to timeout on second window binding", async () => {
  const window1 = await createWindow();
  const window2 = await createWindow();
  // Arrange for window 2 to bind too late, after main times out
  setIpcBindingTimeout(ACCEPTABLE_DELAY_MILLIS);
  // Window 1 binds to API 2 just fine.
  exposeMainApi(window1, mainApi2, restorer);
  await resultCollector.runScriptInWindow(window1, "win1_api_2_patient");
  exposeMainApi(window2, mainApi2, restorer);
  await resultCollector.runScriptInWindow(window2, "win2_api_2_delayed");
  await sleep(ACCEPTABLE_DELAY_MILLIS * 1.2);
  if (window1) window1.destroy();
  if (window2) window2.destroy();
});
