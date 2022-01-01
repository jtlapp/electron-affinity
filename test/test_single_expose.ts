import "source-map-support/register";
import { BrowserWindow } from "electron";

import { exposeMainApi } from "../src/server_ipc";
import { createWindow, ResultCollector } from "./lib/main_util";
import { TestApi1 } from "./api/test_api_1";
import { TestApi2 } from "./api/test_api_2";
import { recoverClass } from "./lib/shared_util";
import verifyApi1 from "./api/verify_api_1";
import verifyApi2 from "./api/verify_api_2";

// import { setIpcErrorLogger } from "../src/ipc";
// setIpcErrorLogger((err) => console.log("\n(MAIN IPC ERROR) " + err.stack));

const collector = new ResultCollector(recoverClass);
const serverApi1 = new TestApi1(collector);
const serverApi2 = new TestApi2(collector);

describe("single exposure of APIs", () => {
  describe("renderer invoking main", () => {
    let window: BrowserWindow;

    before(async () => {
      window = await createWindow();
      await collector.runScriptInWindow(window, "invoke_tests");
      // TODO: single-exposure functionality not written yet
      exposeMainApi(window, serverApi1, recoverClass);
      exposeMainApi(window, serverApi2, recoverClass);
      await collector.waitForResults();
    });

    verifyApi1(collector);
    verifyApi2(collector);

    after(() => {
      if (window) window.destroy();
      collector.verifyAllDone();
    });
  });
});
