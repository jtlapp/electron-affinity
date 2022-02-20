import * as assert from "assert";

import { ResultCollector } from "../lib/main_util";

const test = it;

export default (winTag: string, collector: ResultCollector) => {
  winTag = winTag + " ";

  test(winTag + "send no parameters (api1)", async () => {
    collector.verifyTest(winTag + "no params (win api1)", (result) => {
      assert.equal(result.requestDataTests, "");
    });
  });

  test(winTag + "send same method (win api1)", async () => {
    collector.verifyTest(winTag + "same method (win api1)", (result) => {
      assert.equal(result.requestDataTests, "X");
    });
  });

  test(winTag + "send multiple params (win api1)", async () => {
    collector.verifyTest(winTag + "multi param (win api1)", (result) => {
      assert.equal(result.requestDataTests, "5;10");
    });
  });

  test(winTag + "send restored custom class (win api1)", async () => {
    collector.verifyTest(winTag + "send catter (win api1)", (result) => {
      assert.equal(result.requestDataTests, "true;this;that");
    });
  });

  // test(winTag + "send built-in type (win api1)", async () => {
  //   collector.verifyTest(winTag + "built-in type (win api1)", (result) => {
  //     const expectedDate = new Date("January 1, 2021");
  //     assert.equal(result.requestDataTests, expectedDate);
  //   });
  // });

  // test(winTag + "send structured error (win api1)", async () => {
  //   collector.verifyTest(winTag + "structured error (win api1)", (result) => {
  //     const error = result.requestDataTests;
  //     assert.ok(error instanceof Error);
  //     assert.ok(typeof error.message == "string");
  //     assert.equal((error as any).code, "ENOENT");
  //     assert.equal((error as any).syscall, "open");
  //     assert.ok((error as any).stack.includes("in main process"));
  //   });
  // });

  // test(winTag + "send custom error (win api1)", async () => {
  //   collector.verifyTest(winTag + "custom error (win api1)", (result) => {
  //     const error = result.requestDataTests;
  //     assert.ok(error instanceof CustomError);
  //     assert.equal(error.message, "bad thing");
  //     assert.equal(error.code, 99);
  //     assert.equal(
  //       result.error.stack,
  //       "CustomError: bad thing\n\tin main process"
  //     );
  //   });
  // });
};
