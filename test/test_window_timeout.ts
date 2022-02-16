/**
 * Test to ensure that windows timeout if main does not provide an API.
 */

import * as assert from "assert";
import { BrowserWindow } from "electron";

const test = it;

import { exposeMainApi } from "../src/main";
import { createWindow, createResultCollector } from "./lib/main_util";
import { MainApi1 } from "./api/mainapi1";
import { restorer } from "./lib/shared_util";

const resultCollector = createResultCollector(restorer);

describe("window times out waiting to bind main API", () => {
  const mainApi1 = new MainApi1(resultCollector);
  let window1: BrowserWindow;
  let window2: BrowserWindow;
  let window3: BrowserWindow;

  test("main exposes no APIs, default timeout", async () => {
    window1 = await createWindow();
    resultCollector.runScripFiletInWindow(window1, "win1_mainapi1");
    try {
      await resultCollector.waitForResults();
      assert.fail("Window 1 did not time out");
    } catch (err: any) {
      assert.equal(
        err,
        "win1: Uncaught Error: Timed out waiting to bind main API 'MainApi1'"
      );
    }
    // Don't close window1; its exception destroys it.
  });

  test("main exposes no APIs, custom timeout", async () => {
    window2 = await createWindow();
    resultCollector.runScripFiletInWindow(window2, "win2_mainapi2_timeout");
    try {
      await resultCollector.waitForResults();
      assert.fail("Window 2 did not time out");
    } catch (err: any) {
      assert.equal(
        err,
        "win2: Uncaught Error: Timed out waiting to bind main API 'MainApi2'"
      );
    }
    // Don't close window1; its exception destroys it.
  });

  test("main exposes an API other than the expected one, custom_timeout", async () => {
    window3 = await createWindow();
    exposeMainApi(mainApi1, restorer);
    resultCollector.runScripFiletInWindow(window3, "win3_mainapi2_timeout");
    try {
      await resultCollector.waitForResults();
      assert.fail("Window 3 did not time out");
    } catch (err: any) {
      assert.equal(
        err,
        "win3: Uncaught Error: Timed out waiting to bind main API 'MainApi2'"
      );
    }
    // Don't close window2; its exception destroys it.
  });
});
