/**
 * Test calling methods of a single man API under normal circumstances.
 */

import { BrowserWindow } from "electron";

import { createWindow, createResultCollector } from "./lib/main_util";
import { restorer } from "./lib/shared_util";
import verifyWindowApi1 from "./api/verify_window_api_1";
import { callWindowApi1 } from "./server/call_window_api_1";

const resultCollector = createResultCollector(restorer);

describe("one exposed window API", () => {
  describe("main messaging window", () => {
    let window1: BrowserWindow;

    before(async () => {
      window1 = await createWindow();
      resultCollector.runScripFiletInWindow(window1, "win1_winapi1");
      await callWindowApi1(window1);
      resultCollector.completedAll = true;
      await resultCollector.waitForResults();
    });

    verifyWindowApi1("win1", resultCollector);

    after(() => {
      if (window1) window1.destroy();
      resultCollector.verifyAllDone();
    });
  });
});
