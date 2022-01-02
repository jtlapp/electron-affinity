import "source-map-support/register";
import * as assert from "assert";

import { createWindow, createResultCollector } from "./lib/main_util";
import { recoverer } from "./lib/shared_util";

const resultCollector = createResultCollector(recoverer);

describe("main does not expose API", () => {
  it("window times out", async () => {
    const window1 = await createWindow();
    await resultCollector.runScriptInWindow(window1, "win1_api_1");
    try {
      await resultCollector.waitForResults();
      assert.fail("Window did not time out");
    } catch (err: any) {
      assert.equal(
        err,
        "win1: Uncaught Error: Timed out waiting to bind IPC API 'MainApi1'"
      );
    }
    if (window1) window1.destroy();
  });
});
