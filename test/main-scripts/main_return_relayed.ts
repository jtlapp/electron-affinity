import { exposeMainApi } from "../../src/main";
import { createWindow, createResultCollector } from "../lib/main_util";
import { MainApi3 } from "../api/mainapi3";
import { restorer } from "../lib/shared_util";

const resultCollector = createResultCollector(restorer);
const mainApi3 = new MainApi3(resultCollector);

it("waits for main to crash on API error", async () => {
  const window1 = await createWindow();
  exposeMainApi(mainApi3, restorer);
  await resultCollector.runScripFiletInWindow(window1, "win1_mainapi3b");
  await resultCollector.waitForResults();
  if (window1) window1.destroy();
});
