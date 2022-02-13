import "source-map-support/register";
import { BrowserWindow } from "electron";

import { bindWindowApi, setIpcBindingTimeout } from "../../src/main";
import { ACCEPTABLE_DELAY_MILLIS } from "../lib/config";
import { createWindow, createResultCollector } from "../lib/main_util";
import type { WinApi1 } from "../api/winapi1";
import { restorer } from "../lib/shared_util";
import { sleep } from "../lib/shared_util";
import verifyWindowApi1 from "../api/verify_winapi1";
import { callWindowApi1 } from "../api/call_winapi1";

const resultCollector = createResultCollector(restorer);

let window1: BrowserWindow;
let window2: BrowserWindow;

before(async () => {
  window1 = await createWindow();
  window2 = await createWindow();
  setIpcBindingTimeout(ACCEPTABLE_DELAY_MILLIS);
  // Check for successful binding to window1.
  resultCollector.runScripFiletInWindow(window1, "win1_winapi1");
  await callWindowApi1(window1);
  resultCollector.completedAll = true;
  await resultCollector.waitForResults();
});

verifyWindowApi1("win1", resultCollector);

it("waits for main to timeout binding to second window", async () => {
  bindWindowApi<WinApi1>(window2, "WinApi1");
  // Window 2 doesn't provide the API for binding.
  await sleep(ACCEPTABLE_DELAY_MILLIS * 1.2);
});

after(() => {
  resultCollector.verifyAllDone();
  if (window1) window1.destroy();
  if (window2) window2.destroy();
});
