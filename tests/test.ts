import "source-map-support/register";
import * as assert from "assert";
import { ipcMain, BrowserWindow } from "electron";

import { createWindow, ResultCollector } from "./main";
import serverApi from "./server_api";

describe("basic IPC", () => {
  const collector = new ResultCollector();

  before(async () => {
    const ipcHandlerSets = [
      serverApi(collector), // multiline
    ];
    ipcHandlerSets.forEach((handlerSet) => {
      handlerSet.forEach((handler) => {
        handler.register(ipcMain);
      });
    });
  });

  it("main calls renderer", async () => {
    const window = await createWindow();
    await collector.runScript(window, "call_renderer");

    window.webContents.send("mainEvent", 100);
    window.webContents.send("completedAll");

    await collector.collectResults();
    collector.verifyTest("mainEventTest", (result) => {
      assert.equal(result.error, null);
      assert.equal(result.requestData, 100);
    });
    window.destroy();
  });

  it("renderer calls main", async () => {
    const window = await createWindow();
    await collector.runScript(window, "call_main");
    await collector.collectResults();

    collector.verifyTest("test 42", (result) => {
      assert.equal(result.error, null);
      assert.equal(result.requestData, 21);
      assert.equal(result.replyData, 42);
    });
    window.destroy();
  });

  after(() => {
    const windows = BrowserWindow.getAllWindows();
    windows.forEach((window) => window.destroy());
    collector.destroy();
  });
});
