/**
 * Test main's ability to wait for a window to bind to an API.
 */

import { BrowserWindow } from "electron";

import { exposeMainApi, setIpcBindingTimeout } from "../src/main";
import { ACCEPTABLE_DELAY_MILLIS } from "./lib/config";
import { createWindow, createResultCollector } from "./lib/main_util";
import { MainApi2 } from "./api/mainapi2";
import { restorer } from "./lib/shared_util";
import verifyApi2 from "./api/verify_mainapi2";

// import { dumpMainApiErrors } from "./lib/main_util";
// dumpMainApiErrors();

const resultCollector = createResultCollector(restorer);
const mainApi2 = new MainApi2(resultCollector);

describe("one exposed API with delayed binding", () => {
  describe("window binding after delay and invoking main", () => {
    let window1: BrowserWindow;

    before(async () => {
      window1 = await createWindow();
      setIpcBindingTimeout(ACCEPTABLE_DELAY_MILLIS);
      exposeMainApi(window1, mainApi2, restorer);
      resultCollector.runScripFiletInWindow(window1, "win1_mainapi2_delayed");
      await resultCollector.waitForResults();
    });

    verifyApi2("win1", resultCollector);

    after(() => {
      if (window1) window1.destroy();
      resultCollector.verifyAllDone();
    });
  });
});
