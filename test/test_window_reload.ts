/**
 * Test calling methods after rebinding upon window reload.
 */

import { BrowserWindow } from "electron";

import { exposeMainApi } from "../src/main";
import { createWindow, createResultCollector } from "./lib/main_util";
import { MainApi2 } from "./api/main_api_2";
import { restorer } from "./lib/shared_util";
import verifyApi2 from "./api/verify_main_api_2";

// import { dumpMainApiErrors } from "./lib/main_util";
// dumpMainApiErrors();

const resultCollector = createResultCollector(restorer);
const mainApi2 = new MainApi2(resultCollector);

describe("rebinding after window reload", () => {
  let windowLoaded = false;
  let window1: BrowserWindow;

  const waitForLoad = (resolve: () => void) => {
    setTimeout(() => {
      if (windowLoaded) {
        resolve();
      } else {
        waitForLoad(resolve);
      }
    }, 100);
  };

  before(async () => {
    // Note: I was unable to accomplish this all in one script that installs a
    // window.onload function, as that function never seemed to be called.

    window1 = await createWindow();
    window1.webContents.once("did-finish-load", () => {
      windowLoaded = true;
    });

    exposeMainApi(window1, mainApi2, restorer);
    resultCollector.runScripFiletInWindow(window1, "win1_api_2_reload_1");

    await new Promise<void>((resolve) => waitForLoad(resolve));
    resultCollector.runScripFiletInWindow(window1, "win1_api_2_reload_2");
    await resultCollector.waitForResults();
  });

  verifyApi2("win1", resultCollector);

  after(() => {
    if (window1) window1.destroy();
    resultCollector.verifyAllDone();
  });
});
