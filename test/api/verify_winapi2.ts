import * as assert from "assert";

import { Catter } from "../lib/shared_util";
import { ResultCollector } from "../lib/main_util";

const test = it;

export default (winTag: string, collector: ResultCollector) => {
  winTag = winTag + " ";

  test(winTag + "send same method (win api2)", async () => {
    collector.verifyTest(winTag + "same method (win api2)", (result) => {
      assert.deepEqual(result.requestData, ["Y"]);
    });
  });

  test(winTag + "send restored custom class (win api2)", async () => {
    collector.verifyTest(winTag + "send catter (win api2)", (result) => {
      const catter = result.requestData[0];
      assert.ok(catter instanceof Catter);
      assert.equal(catter.s1, "foo");
      assert.equal(catter.s2, "bar");
    });
  });
};
