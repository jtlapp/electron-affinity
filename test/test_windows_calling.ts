/**
 * Test binding the same main APIs in different windows.
 */

import { BrowserWindow } from "electron";

import { exposeMainApi } from "../src/main";
import { createWindow, createResultCollector } from "./lib/main_util";
import { MainApi1 } from "./api/mainapi1";
import { MainApi2 } from "./api/mainapi2";
import { restorer } from "./lib/shared_util";
import verifyMainApi1 from "./api/verify_mainapi1";
import verifyMainApi2 from "./api/verify_mainapi2";

const resultCollector = createResultCollector(restorer);

describe("two windows calling the same main APIs", () => {
  const mainApi1 = new MainApi1(resultCollector);
  const mainApi2 = new MainApi2(resultCollector);
  let window1: BrowserWindow;
  let window2: BrowserWindow;

  before(async () => {
    window1 = await createWindow();
    exposeMainApi(mainApi1, restorer);
    exposeMainApi(mainApi2, restorer);
    window2 = await createWindow();
    exposeMainApi(mainApi1, restorer);
    exposeMainApi(mainApi2, restorer);
  });

  describe("window 1 invoking main", () => {
    before(async () => {
      resultCollector.runScripFiletInWindow(window1, "win1_mainapi1+2");
      await resultCollector.waitForResults();
    });

    verifyMainApi1("win1", resultCollector);
    verifyMainApi2("win1", resultCollector);

    after(() => {
      resultCollector.verifyAllDone();
      if (window1) window1.destroy();
    });
  });

  describe("window 2 invoking main", () => {
    before(async () => {
      resultCollector.runScripFiletInWindow(window2, "win2_mainapi1+2");
      await resultCollector.waitForResults();
    });

    verifyMainApi1("win2", resultCollector);
    verifyMainApi2("win2", resultCollector);

    after(() => {
      resultCollector.verifyAllDone();
      if (window2) window2.destroy();
    });
  });
});
