import "source-map-support/register";
import * as assert from "assert";
import { ipcMain, BrowserWindow } from "electron";

import { createWindow, ResultCollector } from "./lib/main_util";
import serverApi from "./api/server_api";

const collector = new ResultCollector();

describe("renderer invoking main", () => {
  let window: BrowserWindow;

  before(async () => {
    const ipcHandlerSets = [
      serverApi(collector), // multiline
    ];
    ipcHandlerSets.forEach((handlerSet) => {
      handlerSet.forEach((handler) => {
        handler.register(ipcMain);
      });
    });

    window = await createWindow();
    await collector.runScriptInWindow(window, "invoke_tests");
    await collector.waitForResults();
  });

  it("single-parameter invoke", async () => {
    collector.verifyTest("single param", (result) => {
      assert.equal(result.error, null);
      assert.deepEqual(result.requestData, [21]);
      assert.equal(result.replyData, 42);
    });
  });

  it("multi-parameter invoke", async () => {
    collector.verifyTest("multi param", (result) => {
      assert.equal(result.error, null);
      assert.deepEqual(result.requestData, [5, 10]);
      assert.equal(result.replyData, 15);
    });
  });

  it("invoke with structured error", async () => {
    collector.verifyTest("structured error", (result) => {
      assert.notEqual(JSON.stringify(result.error), null);
      assert.equal(result.error.code, "ENOENT");
      assert.equal(result.error.syscall, "open");
      assert.equal(result.requestData, undefined);
      assert.equal(result.replyData, undefined);
    });
  });

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
