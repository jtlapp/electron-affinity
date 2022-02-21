import * as assert from "assert";

import { Catter } from "../lib/shared_util";
import { ResultCollector } from "../lib/main_util";

const test = it;

export default (winTag: string, collector: ResultCollector) => {
  winTag = winTag + " ";

  test(
    winTag + "send/receive class instance as object, no restorer (api4)",
    async () => {
      collector.verifyTest(
        winTag + "class instance as object (api4)",
        (result) => {
          const requestCatter = new Catter("this", "that");
          const replyCatter = new Catter("foo", "bar");
          assert.equal(result.error, null);
          const arg = result.requestData[0];
          assert.ok(!(arg instanceof Catter));
          assert.deepEqual(arg, requestCatter);
          assert.equal(
            result.replyData,
            "object:" + JSON.stringify(replyCatter)
          );
        }
      );
    }
  );

  test(
    winTag + "send/receive plain non-thrown error, no restorer (api4)",
    async () => {
      collector.verifyTest(winTag + "pass plain error (api4)", (result) => {
        assert.equal(result.error, null);
        assert.ok(result.requestData[0] instanceof Error);
        assert.equal(result.requestData[0].message, "request error");
        assert.equal(result.replyData, "Error:reply error");
      });
    }
  );

  test(winTag + "invoke throwing plain error, no restorer (api4)", async () => {
    collector.verifyTest(winTag + "rethrown plain error (api4)", (result) => {
      assert.ok(result.error instanceof Error);
      assert.equal(result.error.message, "thrown error");
      assert.equal(
        result.error.stack,
        "Error: thrown error\n\tin main process"
      );
      assert.deepEqual(result.requestData, undefined);
      assert.equal(result.replyData, "undefined");
    });
  });
};
