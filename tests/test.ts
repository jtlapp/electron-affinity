import "source-map-support/register";
import * as assert from "assert";
import { ipcMain, BrowserWindow } from "electron";

import { createWindow, ScriptRunner } from "./main_util";
import serverApi from "./server_api";

describe("basic IPC", () => {
  const runner = new ScriptRunner();

  before(async () => {
    const ipcHandlerSets = [
      serverApi(runner), // multiline
    ];
    ipcHandlerSets.forEach((handlerSet) => {
      handlerSet.forEach((handler) => {
        handler.register(ipcMain);
      });
    });
  });

  it("gets called and returns a value", async () => {
    const window = await createWindow();
    await runner.runScript(window, "client_side");
    runner.verifyTest("test 42", (result) => {
      assert.equal(result.requestData, 21);
      assert.equal(result.replyData, 42);
      assert.equal(result.error, null);
    });
    window.destroy();
  });

  after(() => {
    const windows = BrowserWindow.getAllWindows();
    windows.forEach((window) => window.destroy());
    runner.destroy();
  });
});
