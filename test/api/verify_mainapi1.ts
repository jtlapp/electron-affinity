import * as assert from "assert";

import {
  Catter,
  CustomError,
  NoMessageError,
  NonErrorObject,
} from "../lib/shared_util";
import { ResultCollector } from "../lib/main_util";

const test = it;

export default (winTag: string, collector: ResultCollector) => {
  winTag = winTag + " ";

  test(winTag + "invoke with no reply and no error (api1)", async () => {
    collector.verifyTest(winTag + "no reply no error (api1)", (result) => {
      assert.equal(result.error, null);
      assert.deepEqual(result.requestData, undefined);
      assert.equal(result.replyData, "undefined");
    });
  });

  test(winTag + "single-parameter invoke (api1)", async () => {
    collector.verifyTest(winTag + "single param (api1)", (result) => {
      assert.equal(result.error, null);
      assert.deepEqual(result.requestData, [21]);
      assert.equal(result.replyData, "number:42");
    });
  });

  test(winTag + "multi-parameter invoke (api1)", async () => {
    collector.verifyTest(winTag + "multi param (api1)", (result) => {
      assert.equal(result.error, null);
      assert.deepEqual(result.requestData, [5, 10]);
      assert.equal(result.replyData, "number:15");
    });
  });

  test(winTag + "sending class instance (api1)", async () => {
    collector.verifyTest(winTag + "send class instance (api1)", (result) => {
      assert.equal(result.error, null);
      assert.ok(result.requestData[0] instanceof Catter);
      assert.equal(result.replyData, 'string:"thisthat"');
    });
  });

  test(winTag + "getting class instance (api1)", async () => {
    collector.verifyTest(winTag + "get class instance (api1)", (result) => {
      assert.equal(result.error, null);
      assert.deepEqual(result.requestData, ["this", "that"]);
      assert.equal(result.replyData, 'Catter:{"s1":"this","s2":"that"}');
    });
  });

  test(winTag + "conditional error succeeding (api1)", async () => {
    collector.verifyTest(winTag + "all good (api1)", (result) => {
      assert.equal(result.error, null);
      assert.deepEqual(result.requestData, [true]);
      assert.equal(result.replyData, 'string:"all good"');
    });
  });

  test(winTag + "invoke throwing plain error (api1)", async () => {
    collector.verifyTest(winTag + "plain error (api1)", (result) => {
      assert.ok(result.error instanceof Error);
      assert.equal(result.error.message, "Just a plain error");
      assert.equal(
        result.error.stack,
        "Error: Just a plain error\n\tin main process"
      );
      assert.deepEqual(result.requestData, [false]);
      assert.equal(result.replyData, "undefined");
    });
  });

  test(winTag + "invoke same method name (api1)", async () => {
    collector.verifyTest(winTag + "same method (api1)", (result) => {
      assert.equal(result.error, null);
      assert.deepEqual(result.requestData, null);
      assert.equal(result.replyData, 'string:"API 1"');
    });
  });

  test(winTag + "echo back null (api1)", async () => {
    collector.verifyTest(winTag + "echo back null (api1)", (result) => {
      assert.equal(result.error, null);
      assert.deepEqual(result.requestData, [null]);
      assert.equal(result.replyData, "null");
    });
  });

  test(winTag + "echo back boolean (api1)", async () => {
    collector.verifyTest(winTag + "echo back boolean (api1)", (result) => {
      assert.equal(result.error, null);
      assert.deepEqual(result.requestData, [true]);
      assert.equal(result.replyData, "boolean:true");
    });
  });

  test(winTag + "echo back single array (api1)", async () => {
    collector.verifyTest(winTag + "echo back single array (api1)", (result) => {
      const expectedResult = ["foo", "bar"];
      assert.equal(result.error, null);
      assert.deepEqual(result.requestData, [expectedResult]);
      assert.equal(result.replyData, "Array:" + JSON.stringify(expectedResult));
    });
  });

  test(winTag + "echo back built-in class Date (api1)", async () => {
    collector.verifyTest(winTag + "echo back Date (api1)", (result) => {
      const expectedDate = new Date("January 1, 2021");
      assert.equal(result.error, null);
      assert.deepEqual(result.requestData, [expectedDate]);
      assert.equal(result.replyData, "Date:" + JSON.stringify(expectedDate));
    });
  });

  test(winTag + "echo back plain error (api1)", async () => {
    collector.verifyTest(winTag + "echo back plain error (api1)", (result) => {
      const expectedResult = { message: "plain error" };
      assert.equal(result.error, null);
      const arg = result.requestData[0];
      assert.ok(arg instanceof Error);
      assert.equal(arg.message, [expectedResult.message]);
      // Electron strips the stack.
      assert.equal(result.replyData, "Error:" + expectedResult.message);
    });
  });

  test(winTag + "echo back custom error (api1)", async () => {
    collector.verifyTest(winTag + "echo back custom error (api1)", (result) => {
      const expectedResult = { message: "bad thing", code: 99 };
      assert.equal(result.error, null);
      const arg = result.requestData[0];
      assert.ok(arg instanceof CustomError);
      assert.equal(arg.message, expectedResult.message);
      // Electron strips the code and stack.
      assert.equal(result.replyData, "CustomError:" + expectedResult.message);
    });
  });

  test(winTag + "invoke throwing structured error (api1)", async () => {
    collector.verifyTest(winTag + "structured error (api1)", (result) => {
      const error = result.error as any;
      assert.ok(error instanceof Error);
      assert.ok(typeof error.message == "string");
      assert.equal((error as any).code, "ENOENT");
      assert.equal((error as any).syscall, "open");
      assert.ok((error as any).stack.includes("in main process"));
      assert.equal(result.requestData, undefined);
      assert.equal(result.replyData, "undefined");
    });
  });

  test(winTag + "invoke throwing custom error (api1)", async () => {
    collector.verifyTest(winTag + "custom error (api1)", (result) => {
      const error = result.error as any;
      assert.ok(error instanceof CustomError);
      assert.equal(error.message, "bad thing");
      assert.equal(error.code, 99);
      assert.equal(
        result.error.stack,
        "CustomError: bad thing\n\tin main process"
      );
      assert.equal(result.requestData, undefined);
      assert.equal(result.replyData, "undefined");
    });
  });

  test(winTag + "invoke throwing string error (api1)", async () => {
    collector.verifyTest(winTag + "string error (api1)", (result) => {
      const error = result.error as any;
      assert.equal(error, "error string");
      assert.equal(typeof error, "string");
      assert.equal((error as any).message, undefined);
      assert.equal(result.requestData, undefined);
      assert.equal(result.replyData, "undefined");
    });
  });

  test(winTag + "invoke throwing no-message error (api1)", async () => {
    collector.verifyTest(winTag + "no-message error (api1)", (result) => {
      const error = result.error as any;
      assert.ok(error instanceof NoMessageError);
      assert.equal(error.message, ""); // Error message is never undefined
      assert.equal(result.error.stack, "NoMessageError: \n\tin main process");
      assert.equal(result.requestData, undefined);
      assert.equal(result.replyData, "undefined");
    });
  });

  test(winTag + "invoke throwing non-error object (api1)", async () => {
    collector.verifyTest(winTag + "non-error object error (api1)", (result) => {
      const error = result.error as any;
      assert.ok(error instanceof NonErrorObject);
      assert.equal((error as any).message, undefined);
      assert.equal(error.value, "bad");
      assert.equal(result.error.stack, undefined);
      assert.equal(result.requestData, undefined);
      assert.equal(result.replyData, "undefined");
    });
  });

  test(
    winTag + "invoke throwing non-restored custom error (api1)",
    async () => {
      collector.verifyTest(
        winTag + "non-restored custom error (api1)",
        (result) => {
          assert.ok(result.error instanceof Error);
          assert.equal(result.error.message, "non-restored");
          assert.equal(
            result.error.stack,
            "Error: non-restored\n\tin main process"
          );
          assert.deepEqual(result.requestData, undefined);
          assert.equal(result.replyData, "undefined");
        }
      );
    }
  );
};
