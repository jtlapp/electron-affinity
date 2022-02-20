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

  test(winTag + "send null (win api1)", async () => {
    collector.verifyTest(winTag + "null (win api1)", (result) => {
      assert.equal(result.requestDataTests, "null");
    });
  });

  test(winTag + "send boolean (win api1)", async () => {
    collector.verifyTest(winTag + "boolean (win api1)", (result) => {
      assert.equal(result.requestDataTests, "true");
    });
  });

  test(winTag + "send array (win api1)", async () => {
    collector.verifyTest(winTag + "array (win api1)", (result) => {
      const value = ["foo", "bar"];
      assert.equal(result.requestDataTests, value.toString());
    });
  });

  test(winTag + "send built-in type (win api1)", async () => {
    collector.verifyTest(winTag + "built-in type (win api1)", (result) => {
      const expectedDate = new Date("January 1, 2021");
      assert.equal(result.requestDataTests, expectedDate.toString());
    });
  });

  test(winTag + "send structured error (win api1)", async () => {
    collector.verifyTest(winTag + "structured error (win api1)", (result) => {
      // Electron strips the error code and stack.
      assert.equal(
        result.requestDataTests,
        "true;ENOENT: no such file or directory"
      );
    });
  });

  test(winTag + "send custom error (win api1)", async () => {
    collector.verifyTest(winTag + "custom error (win api1)", (result) => {
      // Electron strips the error code and stack.
      assert.equal(result.requestDataTests, "true;bad thing");
    });
  });
};
