import "source-map-support/register";
import * as assert from "assert";
import { ipcMain, BrowserWindow } from "electron";

import { createWindow, ResultCollector } from "./lib/main_util";
import serverApi from "./api/server_api";
import { Catter, CustomError, recoverClass } from "./api/classes";

const collector = new ResultCollector(recoverClass);

describe("renderer invoking main", () => {
  let window: BrowserWindow;
  const test = it;

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

  test("invoke with no reply and no error", async () => {
    collector.verifyTest("no reply no error", (result) => {
      assert.equal(result.error, null);
      assert.deepEqual(result.requestData, undefined);
      assert.equal(result.replyData, undefined);
    });
  });

  test("single-parameter invoke", async () => {
    collector.verifyTest("single param", (result) => {
      assert.equal(result.error, null);
      assert.deepEqual(result.requestData, [21]);
      assert.equal(result.replyData, 42);
    });
  });

  test("multi-parameter invoke", async () => {
    collector.verifyTest("multi param", (result) => {
      assert.equal(result.error, null);
      assert.deepEqual(result.requestData, [5, 10]);
      assert.equal(result.replyData, 15);
    });
  });

  test("sending class instance", async () => {
    collector.verifyTest("send class instance", (result) => {
      assert.equal(result.error, null);
      assert.ok(result.requestData[0] instanceof Catter);
      assert.equal(result.replyData, "thisthat");
    });
  });

  test("getting class instance", async () => {
    collector.verifyTest("get class instance", (result) => {
      assert.equal(result.error, null);
      assert.deepEqual(result.requestData, ["this", "that"]);
      assert.ok(result.replyData instanceof Catter);
      assert.equal(result.replyData.cat(), "thisthat");
    });
  });

  test("invoke throwing plain error", async () => {
    collector.verifyTest("plain error", (result) => {
      assert.ok(result.error instanceof Error);
      assert.equal(result.error.message, "Just a plain error");
      assert.equal(result.requestData, undefined);
      assert.equal(result.replyData, undefined);
    });
  });

  test("invoke throwing structured error", async () => {
    collector.verifyTest("structured error", (result) => {
      const error = result.error as any;
      assert.ok(error instanceof Error);
      assert.ok(typeof error.message == "string");
      assert.equal((error as any).code, "ENOENT");
      assert.equal((error as any).syscall, "open");
      assert.equal(result.requestData, undefined);
      assert.equal(result.replyData, undefined);
    });
  });

  test("invoke throwing custom error", async () => {
    collector.verifyTest("custom error", (result) => {
      const error = result.error as any;
      assert.ok(error instanceof CustomError);
      assert.equal(error.message, "bad thing");
      assert.equal(error.code, 99);
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
