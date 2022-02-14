/**
 * Test main calling APIs on two windows.
 */

import { BrowserWindow } from "electron";

import { createWindow, createResultCollector } from "./lib/main_util";
import { restorer } from "./lib/shared_util";
import { callWindowApi1 } from "./api/call_winapi1";
import { callWindowApi2 } from "./api/call_winapi2";
import verifyWindowApi1 from "./api/verify_winapi1";
import verifyWindowApi2 from "./api/verify_winapi2";

const resultCollector = createResultCollector(restorer);

describe("main calling the same APIs in two windows", () => {
  let window1: BrowserWindow;
  let window2: BrowserWindow;

  before(async () => {
    window1 = await createWindow();
    window2 = await createWindow();

    resultCollector.runScripFiletInWindow(window1, "win1_winapi1_2");
    resultCollector.runScripFiletInWindow(window2, "win2_winapi1_2");
    await callWindowApi1(window1);
    await callWindowApi2(window1);
    await callWindowApi1(window2);
    await callWindowApi2(window2);
    resultCollector.completedAll();
    await resultCollector.waitForResults();
  });

  verifyWindowApi1("win1", resultCollector);
  verifyWindowApi2("win1", resultCollector);
  verifyWindowApi1("win2", resultCollector);
  verifyWindowApi2("win2", resultCollector);

  after(() => {
    if (window1) window1.destroy();
    if (window2) window2.destroy();
    resultCollector.verifyAllDone();
  });
});
