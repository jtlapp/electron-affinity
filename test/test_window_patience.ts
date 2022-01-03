import "source-map-support/register";
import * as assert from "assert";
import { BrowserWindow } from "electron";

const test = it;

import { exposeMainApi } from "../src";
import { MAIN_INITIAL_DELAY_MILLIS } from "./lib/config";
import { createWindow, createResultCollector } from "./lib/main_util";
import { MainApi2 } from "./api/main_api_2";
import verifyApi2 from "./api/verify_api_2";
import { recoverer, sleep } from "./lib/shared_util";

const resultCollector = createResultCollector(recoverer);

describe("patience of renderer for recieving main APIs", () => {
  const mainApi2 = new MainApi2(resultCollector);
  let window1: BrowserWindow;
  let window2: BrowserWindow;

  describe("window waits for main API and successfully binds", () => {
    before(async () => {
      window1 = await createWindow();
      await resultCollector.runScriptInWindow(window1, "win2_api_2_patient");
      await sleep(MAIN_INITIAL_DELAY_MILLIS);
      exposeMainApi(window1, mainApi2, recoverer);
      await resultCollector.waitForResults();
    });

    verifyApi2("win2", resultCollector);

    after(() => {
      if (window1) window1.destroy();
      resultCollector.verifyAllDone();
    });
  });

  describe("main takes too long to send API", () => {
    before(async () => {
      window2 = await createWindow();
      await resultCollector.runScriptInWindow(window2, "win2_api_2_patient");
    });

    test("window times out", async () => {
      await sleep(MAIN_INITIAL_DELAY_MILLIS * 2);
      exposeMainApi(window2, mainApi2, recoverer);
      try {
        await resultCollector.waitForResults();
        assert.fail("Window did not time out");
      } catch (err: any) {
        assert.equal(
          err,
          "win2: Uncaught Error: Timed out waiting to bind IPC API 'MainApi2'"
        );
      }
    });

    after(() => {
      if (window2) window2.destroy();
    });
  });
});
