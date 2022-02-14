import * as assert from "assert";

import { Catter } from "../lib/shared_util";
import { ResultCollector } from "../lib/main_util";

const test = it;

export default (winTag: string, collector: ResultCollector) => {
  winTag = winTag + " ";

  test(winTag + "send no parameters (api1)", async () => {
    collector.verifyTest(winTag + "no params (win api1)", (result) => {
      assert.deepEqual(result.requestData, undefined);
    });
  });

  test(winTag + "send same method (win api1)", async () => {
    collector.verifyTest(winTag + "same method (win api1)", (result) => {
      assert.deepEqual(result.requestData, ["X"]);
    });
  });

  test(winTag + "send multiple params (win api1)", async () => {
    collector.verifyTest(winTag + "multi param (win api1)", (result) => {
      assert.deepEqual(result.requestData, [5, 10]);
    });
  });

  test(winTag + "send restored custom class (win api1)", async () => {
    collector.verifyTest(winTag + "send catter (win api1)", (result) => {
      const catter = result.requestData[0];
      assert.ok(catter instanceof Catter);
      assert.equal(catter.s1, "this");
      assert.equal(catter.s2, "that");
    });
  });

  // test(winTag + "send built-in type (win api1)", async () => {
  //   collector.verifyTest(winTag + "built-in type (win api1)", (result) => {
  //     const expectedDate = new Date("January 1, 2021");
  //     assert.equal(result.requestData, expectedDate);
  //   });
  // });

  // test(winTag + "send structured error (win api1)", async () => {
  //   collector.verifyTest(winTag + "structured error (win api1)", (result) => {
  //     const error = result.requestData;
  //     assert.ok(error instanceof Error);
  //     assert.ok(typeof error.message == "string");
  //     assert.equal((error as any).code, "ENOENT");
  //     assert.equal((error as any).syscall, "open");
  //     assert.ok((error as any).stack.includes("in main process"));
  //   });
  // });

  // test(winTag + "send custom error (win api1)", async () => {
  //   collector.verifyTest(winTag + "custom error (win api1)", (result) => {
  //     const error = result.requestData;
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
