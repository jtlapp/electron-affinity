/**
 * Test binding the same main APIs in different windows, and
 * test main subsequently calling an API on one of these windows.
 */

import { BrowserWindow } from "electron";

import { exposeMainApi } from "../src/main";
import { createWindow, createResultCollector } from "./lib/main_util";
import { MainApi1 } from "./api/mainapi1";
import { MainApi2 } from "./api/mainapi2";
import { restorer } from "./lib/shared_util";
import verifyApi1 from "./api/verify_mainapi1";
import verifyApi2 from "./api/verify_mainapi2";
import verifyWindowApi1 from "./api/verify_winapi1";
import { callWindowApi1 } from "./api/call_winapi1";

// import { dumpMainApiErrors } from "./lib/main_util";
// dumpMainApiErrors();

const resultCollector = createResultCollector(restorer);

describe("two windows with two APIs", () => {
  const mainApi1 = new MainApi1(resultCollector);
  const mainApi2 = new MainApi2(resultCollector);
  let window1: BrowserWindow;
  let window2: BrowserWindow;

  before(async () => {
    window1 = await createWindow();
    exposeMainApi(window1, mainApi1, restorer);
    exposeMainApi(window1, mainApi2, restorer);
    window2 = await createWindow();
    exposeMainApi(window2, mainApi1, restorer);
    exposeMainApi(window2, mainApi2, restorer);
  });

  describe("window 1 invoking main", () => {
    before(async () => {
      resultCollector.runScripFiletInWindow(window1, "win1_mainapi1+2");
      await resultCollector.waitForResults();
    });

    verifyApi1("win1", resultCollector);
    verifyApi2("win1", resultCollector);

    after(() => {
      resultCollector.verifyAllDone();
    });
  });

  describe("window 2 invoking main", () => {
    before(async () => {
      resultCollector.runScripFiletInWindow(window2, "win2_mainapi1+2");
      await resultCollector.waitForResults();
    });

    verifyApi1("win2", resultCollector);
    verifyApi2("win2", resultCollector);

    after(() => {
      resultCollector.verifyAllDone();
    });
  });

  describe("main invoking window 1 after being invoked", () => {
    before(async () => {
      window1 = await createWindow();
      resultCollector.runScripFiletInWindow(window1, "win1_winapi1");
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

  after(() => {
    if (window1) window1.destroy();
  });
});
