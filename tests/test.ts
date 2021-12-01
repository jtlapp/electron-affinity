import "source-map-support/register";
import * as assert from "assert";
import { ipcMain, BrowserWindow } from "electron";

import { createWindow, ResultCollector } from "./main";
import serverApi from "./server_api";

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

  it("successful invoke", async () => {
    collector.verifyTest("test 42", (result) => {
      assert.equal(result.error, null);
      assert.equal(result.requestData, 21);
      assert.equal(result.replyData, 42);
    });
  });

  it("invoke with FS error", async () => {
    collector.verifyTest("test FS error", (result) => {
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
