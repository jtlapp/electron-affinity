/**
 * Test the ability of a window to wait for man to register an API.
 */

import "source-map-support/register";
import * as assert from "assert";
import { BrowserWindow } from "electron";

const test = it;

import { exposeMainApi } from "../src";
import { ACCEPTABLE_DELAY_MILLIS } from "./lib/config";
import { createWindow, createResultCollector } from "./lib/main_util";
import { MainApi2 } from "./api/main_api_2";
import verifyApi2 from "./api/verify_api_2";
import { restorer, sleep } from "./lib/shared_util";

const resultCollector = createResultCollector(restorer);

describe("patience of renderer for recieving main APIs", () => {
  const mainApi2 = new MainApi2(resultCollector);

  describe("window waits for main API and successfully binds", () => {
    let window1: BrowserWindow;

    before(async () => {
      window1 = await createWindow();

      resultCollector.runScriptInWindow(window1, "win1_api_2_patient");
      await sleep(ACCEPTABLE_DELAY_MILLIS * 0.8);
      exposeMainApi(window1, mainApi2, restorer);
      await resultCollector.waitForResults();
    });

    verifyApi2("win1", resultCollector);

    after(() => {
      if (window1) window1.destroy();
      resultCollector.verifyAllDone();
    });
  });

  describe("main takes too long to send API", () => {
    let window2: BrowserWindow;

    // This must be the last test because it eventually times out for failure
    // for a window to bind to an API, ending Electron with an uncaught error.
    // I haven't been able to intercept uncaught errors in electron-mocha.

    test("window times out", async () => {
      window2 = await createWindow();
      // Run the window1 script again on window2 to be sure that its' the
      // change in timing that prevents the binding.
      resultCollector.runScriptInWindow(window2, "win1_api_2_patient");
      await sleep(ACCEPTABLE_DELAY_MILLIS * 1.2);
      exposeMainApi(window2, mainApi2, restorer);
      try {
        await resultCollector.waitForResults();
        assert.fail("Window did not time out");
      } catch (err: any) {
        assert.equal(
          err,
          "win1: Uncaught Error: Timed out waiting to bind main API 'MainApi2'"
        );
      }
      // Don't close window2; its exception destroys it.
    });
  });
});
