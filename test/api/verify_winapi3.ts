import * as assert from "assert";

import { ResultCollector } from "../lib/main_util";

const test = it;

export default (winTag: string, collector: ResultCollector) => {
  winTag = winTag + " ";

  test(
    winTag + "send class instance as object, no restorer (win api3)",
    async () => {
      collector.verifyTest(
        winTag + "class instance as object (win api3)",
        (result) => {
          assert.equal(result.requestDataTests, "false;foo;bar");
        }
      );
    }
  );

  test(winTag + "send error, no restorer (win api3)", async () => {
    collector.verifyTest(winTag + "error as arg (win api3)", (result) => {
      // Electron strips the error code and stack.
      assert.equal(result.requestDataTests, "true;restored error");
    });
  });
};
