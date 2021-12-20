import "source-map-support/register";
import * as assert from "assert";
import { BrowserWindow } from "electron";

import { exposeServerApi } from "../src/server_ipc";
import { createWindow, ResultCollector } from "./lib/main_util";
import { TestApi1 } from "./api/test_api_1";
import { TestApi2 } from "./api/test_api_2";
import { Catter, CustomError, recoverClass } from "./api/classes";

// import { setIpcErrorLogger } from "../src/ipc";
// setIpcErrorLogger((err) => console.log("\n(MAIN IPC ERROR) " + err.stack));

const collector = new ResultCollector(recoverClass);
const serverApi1 = new TestApi1(collector);
const serverApi2 = new TestApi2(collector);

describe("renderer invoking main", () => {
  let window: BrowserWindow;
  const test = it;

  before(async () => {
    window = await createWindow();
    await collector.runScriptInWindow(window, "invoke_tests");
    exposeServerApi(window, serverApi1, recoverClass);
    exposeServerApi(window, serverApi2, recoverClass);
    await collector.waitForResults();
  });

  // Test API 1

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

  test("sending class instance via API 1", async () => {
    collector.verifyTest("send class instance 1", (result) => {
      assert.equal(result.error, null);
      assert.ok(result.requestData[0] instanceof Catter);
      assert.equal(result.replyData, "thisthat");
    });
  });

  test("getting class instance via API 1", async () => {
    collector.verifyTest("get class instance 1", (result) => {
      assert.equal(result.error, null);
      assert.deepEqual(result.requestData, ["this", "that"]);
      assert.ok(result.replyData instanceof Catter);
      assert.equal(result.replyData.cat(), "thisthat");
    });
  });

  test("conditional error succeeding via API 1", async () => {
    collector.verifyTest("all good 1", (result) => {
      assert.equal(result.error, null);
      assert.deepEqual(result.requestData, [true]);
      assert.equal(result.replyData, "all good");
    });
  });

  test("invoke throwing plain error via API 1", async () => {
    collector.verifyTest("plain error 1", (result) => {
      assert.ok(result.error instanceof Error);
      assert.equal(result.error.message, "Just a plain error");
      assert.equal(
        result.error.stack,
        "Error: Just a plain error\n\tin main process"
      );
      assert.deepEqual(result.requestData, [false]);
      assert.equal(result.replyData, undefined);
    });
  });

  test("invoke same method name via API 1", async () => {
    collector.verifyTest("same method api 1", (result) => {
      assert.equal(result.error, null);
      assert.deepEqual(result.requestData, null);
      assert.equal(result.replyData, "API 1");
    });
  });

  test("invoke throwing structured error", async () => {
    collector.verifyTest("structured error", (result) => {
      const error = result.error as any;
      assert.ok(error instanceof Error);
      assert.ok(typeof error.message == "string");
      assert.equal((error as any).code, "ENOENT");
      assert.equal((error as any).syscall, "open");
      assert.ok((error as any).stack.includes("in main process"));
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
      assert.equal(
        result.error.stack,
        "CustomError: bad thing\n\tin main process"
      );
      assert.equal(result.requestData, undefined);
      assert.equal(result.replyData, undefined);
    });
  });

  // Test API 2

  test("sending class instance via API 2", async () => {
    collector.verifyTest("send class instance 2", (result) => {
      assert.equal(result.error, null);
      assert.ok(result.requestData[0] instanceof Catter);
      assert.equal(result.replyData, "thisthat");
    });
  });

  test("getting class instance via API 2", async () => {
    collector.verifyTest("get class instance 2", (result) => {
      assert.equal(result.error, null);
      assert.deepEqual(result.requestData, ["this", "that"]);
      assert.ok(result.replyData instanceof Catter);
      assert.equal(result.replyData.cat(), "thisthat");
    });
  });

  test("conditional error succeeding via API 2", async () => {
    collector.verifyTest("all good 2", (result) => {
      assert.equal(result.error, null);
      assert.deepEqual(result.requestData, [true]);
      assert.equal(result.replyData, "all good");
    });
  });

  test("invoke throwing plain error via API 2", async () => {
    collector.verifyTest("plain error 2", (result) => {
      assert.ok(result.error instanceof Error);
      assert.equal(result.error.message, "Just a plain error");
      assert.equal(
        result.error.stack,
        "Error: Just a plain error\n\tin main process"
      );
      assert.deepEqual(result.requestData, [false]);
      assert.equal(result.replyData, undefined);
    });
  });

  test("invoke same method name via API 2", async () => {
    collector.verifyTest("same method api 2", (result) => {
      assert.equal(result.error, null);
      assert.deepEqual(result.requestData, null);
      assert.equal(result.replyData, "API 2");
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
    exposeServerApi(window, serverApi1, recoverClass);
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
