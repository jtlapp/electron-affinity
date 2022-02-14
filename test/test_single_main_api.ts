/**
 * Test calling methods of a single main API under normal circumstances.
 */

import { BrowserWindow } from "electron";

import { exposeMainApi } from "../src/main";
import { createWindow, createResultCollector } from "./lib/main_util";
import { MainApi1 } from "./api/mainapi1";
import { restorer } from "./lib/shared_util";
import verifyApi1 from "./api/verify_mainapi1";

// import { dumpMainApiErrors } from "./lib/main_util";
// dumpMainApiErrors();

// TODO: test passing arrays

const resultCollector = createResultCollector(restorer);
const mainApi1 = new MainApi1(resultCollector);

describe("window invoking an exposed main API", () => {
  let window1: BrowserWindow;

  before(async () => {
    window1 = await createWindow();
    // includes test of exposing API after running script
    resultCollector.runScripFiletInWindow(window1, "win1_mainapi1");
    exposeMainApi(window1, mainApi1, restorer);
    await resultCollector.waitForResults();
  });

  verifyApi1("win1", resultCollector);

  after(() => {
    if (window1) window1.destroy();
    resultCollector.verifyAllDone();
  });
});
