/**
 * Test main's ability to wait for a window to bind to an API.
 */

import "source-map-support/register";
import { BrowserWindow } from "electron";

import { exposeMainApi, setIpcBindingTimeout } from "../src";
import { ACCEPTABLE_DELAY_MILLIS } from "./lib/config";
import { createWindow, createResultCollector } from "./lib/main_util";
import { MainApi2 } from "./api/main_api_2";
import { recoverer } from "./lib/shared_util";
import verifyApi2 from "./api/verify_api_2";

// import { dumpMainApiErrors } from "./lib/main_util";
// dumpMainApiErrors();

const resultCollector = createResultCollector(recoverer);
const mainApi2 = new MainApi2(resultCollector);

describe("one exposed API with delayed binding", () => {
  describe("window binding after delay and invoking main", () => {
    let window1: BrowserWindow;

    before(async () => {
      window1 = await createWindow();
      setIpcBindingTimeout(ACCEPTABLE_DELAY_MILLIS);
      exposeMainApi(window1, mainApi2, recoverer);
      await resultCollector.runScriptInWindow(window1, "win1_api_2_delayed");
      await resultCollector.waitForResults();
    });

    verifyApi2("win1", resultCollector);

    after(() => {
      if (window1) window1.destroy();
      resultCollector.verifyAllDone();
    });
  });
});
