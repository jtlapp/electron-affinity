import "source-map-support/register";
import { BrowserWindow } from "electron";

import { exposeMainApi } from "../src";
import { createWindow, createResultCollector } from "./lib/main_util";
import { MainApi1 } from "./api/main_api_1";
import { recoverer } from "./lib/shared_util";
import verifyApi1 from "./api/verify_api_1";

// import { dumpMainApiErrors } from "./lib/main_util";
// dumpMainApiErrors();

const resultCollector = createResultCollector(recoverer);
const mainApi1 = new MainApi1(resultCollector);

describe("one exposed API", () => {
  describe("window invoking main", () => {
    let window1: BrowserWindow;

    before(async () => {
      window1 = await createWindow();
      await resultCollector.runScriptInWindow(window1, "win1_api_1");
      exposeMainApi(window1, mainApi1, recoverer);
      await resultCollector.waitForResults();
    });

    verifyApi1("win1", resultCollector);

    after(() => {
      if (window1) window1.destroy();
      resultCollector.verifyAllDone();
    });
  });
});
