import * as assert from "assert";

import { ResultCollector } from "../lib/main_util";

const test = it;

export default (winTag: string, collector: ResultCollector) => {
  winTag = winTag + " ";

  test(winTag + "send same method (win api2)", async () => {
    collector.verifyTest(winTag + "same method (win api2)", (result) => {
      assert.equal(result.requestData, "Y");
    });
  });

  test(winTag + "send restored custom class (win api2)", async () => {
    collector.verifyTest(winTag + "send catter (win api2)", (result) => {
      assert.equal(result.requestData, "true;foo;bar");
    });
  });
};
