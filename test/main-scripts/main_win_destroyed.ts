import "source-map-support/register";

import { exposeMainApi, setIpcBindingTimeout } from "../../src/main";
import { ACCEPTABLE_DELAY_MILLIS } from "../lib/config";
import { createWindow, createResultCollector } from "../lib/main_util";
import { MainApi2 } from "../api/mainapi2";
import { restorer } from "../lib/shared_util";
import { sleep } from "../lib/shared_util";

const resultCollector = createResultCollector(restorer);
const mainApi2 = new MainApi2(resultCollector);

it("waits for main to timeout on window destroyed", async () => {
  const window1 = await createWindow();
  setIpcBindingTimeout(ACCEPTABLE_DELAY_MILLIS);
  exposeMainApi(window1, mainApi2, restorer);
  await resultCollector.runScripFiletInWindow(window1, "win1_destroyed");
  if (window1) window1.destroy();
  await sleep(ACCEPTABLE_DELAY_MILLIS);
});
