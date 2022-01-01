import "source-map-support/register";
import * as assert from "assert";
import { BrowserWindow } from "electron";

import { exposeMainApi } from "../src";
import { createWindow, ResultCollector } from "./lib/main_util";
import { TestApi1 } from "./api/test_api_1";
import { TestApi2 } from "./api/test_api_2";
import { recoverer } from "./lib/shared_util";
import verifyApi1 from "./api/verify_api_1";
import verifyApi2 from "./api/verify_api_2";

// import { setIpcErrorLogger } from "../src/ipc";
// setIpcErrorLogger((err) => console.log("\n(MAIN IPC ERROR) " + err.stack));

const collector = new ResultCollector(recoverer);
const serverApi1 = new TestApi1(collector);
const serverApi2 = new TestApi2(collector);

describe("multiple exposures of APIs", () => {
  describe("renderer invoking main", () => {
    let window: BrowserWindow;

    before(async () => {
      window = await createWindow();
      await collector.runScriptInWindow(window, "invoke_tests");
      exposeMainApi(window, serverApi1, recoverer);
      exposeMainApi(window, serverApi2, recoverer);
      await collector.waitForResults();
    });

    verifyApi1(collector);
    verifyApi2(collector);

    after(() => {
      if (window) window.destroy();
      collector.verifyAllDone();
    });
  });

  describe("main sending event to renderer", () => {
    let window: BrowserWindow;

    before(async () => {
      window = await createWindow();
      await collector.runScriptInWindow(window, "event_tests");
      window.webContents.send("demo_event", 100);
      window.webContents.send("completed_all");
      await collector.waitForResults();
    });

    it("receives demo event", async () => {
      collector.verifyTest("demoEventTest", (result) => {
        assert.equal(result.error, null);
        assert.equal(result.requestData, 100);
      });
    });

    after(() => {
      if (window) window.destroy();
      collector.verifyAllDone();
    });
  });
});