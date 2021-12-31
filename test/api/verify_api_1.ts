import * as assert from "assert";

import { Catter, CustomError } from "../lib/shared_util";
import { ResultCollector } from "../lib/main_util";

const test = it;

export default (collector: ResultCollector) => {
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
};
