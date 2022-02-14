/**
 * Test main's ability to wait for a window to provide an API for binding.
 */

import { BrowserWindow } from "electron";

import { setIpcBindingTimeout } from "../src/main";
import { ACCEPTABLE_DELAY_MILLIS } from "./lib/config";
import { createWindow, createResultCollector } from "./lib/main_util";
import { restorer } from "./lib/shared_util";
import verifyWindowApi1 from "./api/verify_winapi1";
import { callWindowApi1 } from "./api/call_winapi1";

const resultCollector = createResultCollector(restorer);

describe("delay binding to a window API", () => {
  let window1: BrowserWindow;

  before(async () => {
    window1 = await createWindow();
    setIpcBindingTimeout(ACCEPTABLE_DELAY_MILLIS);
    resultCollector.runScripFiletInWindow(window1, "win1_winapi1_delayed");
    await callWindowApi1(window1);
    resultCollector.completedAll();
    await resultCollector.waitForResults();
  });

  verifyWindowApi1("win1", resultCollector);

  after(() => {
    if (window1) window1.destroy();
    resultCollector.verifyAllDone();
  });
});
