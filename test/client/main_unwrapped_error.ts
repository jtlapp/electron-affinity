import "source-map-support/register";

import { exposeMainApi } from "../../src";
import { createWindow, createResultCollector } from "../lib/main_util";
import { MainApi3 } from "../api/main_api_3";
import { restorer } from "../lib/shared_util";

const resultCollector = createResultCollector(restorer);
const mainApi3 = new MainApi3(resultCollector);

it("waits for main to crash on API error", async () => {
  const window1 = await createWindow();
  exposeMainApi(window1, mainApi3, restorer);
  await resultCollector.runScriptInWindow(window1, "win1_api_3");
  await resultCollector.waitForResults();
  if (window1) window1.destroy();
});
