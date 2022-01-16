/**
 * Test binding the same APIs to different windows.
 */

import "source-map-support/register";
import * as assert from "assert";
import { BrowserWindow } from "electron";

import { exposeMainApi } from "../src";
import { createWindow, createResultCollector } from "./lib/main_util";
import { MainApi1 } from "./api/main_api_1";
import { MainApi2 } from "./api/main_api_2";
import { restorer } from "./lib/shared_util";
import verifyApi1 from "./api/verify_api_1";
import verifyApi2 from "./api/verify_api_2";

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
      // Also tests exposing API before client initiates binding.
      await resultCollector.runScriptInWindow(window1, "win1_api_1_2");
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
      // Also tests exposing API before client initiates binding.
      await resultCollector.runScriptInWindow(window2, "win2_api_1_2");
      await resultCollector.waitForResults();
    });

    verifyApi1("win2", resultCollector);
    verifyApi2("win2", resultCollector);

    after(() => {
      resultCollector.verifyAllDone();
    });
  });

  describe("main sending event to window 1", () => {
    before(async () => {
      await resultCollector.runScriptInWindow(window1, "event_tests");
      window1.webContents.send("demo_event", 100);
      window1.webContents.send("completed_all");
      await resultCollector.waitForResults();
    });

    it("receives demo event", async () => {
      resultCollector.verifyTest("demoEventTest", (result) => {
        assert.equal(result.error, null);
        assert.equal(result.requestData, 100);
      });
    });

    after(() => {
      resultCollector.verifyAllDone();
    });
  });

  after(() => {
    if (window1) window1.destroy();
  });
});
