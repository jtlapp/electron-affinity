import * as assert from "assert";

import { Catter } from "../lib/shared_util";
import { ResultCollector } from "../lib/main_util";

const test = it;

export default (winTag: string, collector: ResultCollector) => {
  winTag = winTag + " ";

  test(winTag + "sending class instance (api2)", async () => {
    collector.verifyTest(winTag + "send class instance (api2)", (result) => {
      assert.equal(result.error, null);
      assert.ok(result.requestData[0] instanceof Catter);
      assert.equal(result.replyData, 'string:"thisthat"');
    });
  });

  test(winTag + "getting class instance (api2)", async () => {
    collector.verifyTest(winTag + "get class instance (api2)", (result) => {
      assert.equal(result.error, null);
      assert.deepEqual(result.requestData, ["this", "that"]);
      assert.equal(result.replyData, 'Catter:{"s1":"this","s2":"that"}');
    });
  });

  test(winTag + "conditional error succeeding (api2)", async () => {
    collector.verifyTest(winTag + "all good (api2)", (result) => {
      assert.equal(result.error, null);
      assert.deepEqual(result.requestData, [true]);
      assert.equal(result.replyData, 'string:"all good"');
    });
  });

  test(winTag + "invoke throwing plain error (api2)", async () => {
    collector.verifyTest(winTag + "plain error (api2)", (result) => {
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

  test(winTag + "invoke same method name (api2)", async () => {
    collector.verifyTest(winTag + "same method (api2)", (result) => {
      assert.equal(result.error, null);
      assert.deepEqual(result.requestData, null);
      assert.equal(result.replyData, 'string:"API 2"');
    });
  });
};
