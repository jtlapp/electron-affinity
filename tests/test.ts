//import "source-map-support/register";
import * as assert from "assert";
import { ipcMain, BrowserWindow } from "electron";

import { createWindow, runScript } from "./util";
import serverApi from "./server_api";

describe("basic IPC", () => {
  let result: any;
  let error: any;

  before(async () => {
    const ipcHandlerSets = [
      serverApi(), // multiline
    ];
    ipcHandlerSets.forEach((handlerSet) => {
      handlerSet.forEach((handler) => {
        handler.register(ipcMain);
      });
    });

    ipcMain.on("result", (_event, data: any) => {
      result = data;
    });
    ipcMain.on("error", (_event, data: any) => {
      error = data;
    });
  });

  it("gets called and returns a value", async () => {
    const window = await createWindow();
    runScript(window, "client_side");
    await new Promise((resolve) => setTimeout(resolve, 500));
    assert.equal(error, undefined);
    assert.equal(result, 42);
    window.destroy();
  });

  after(() => {
    const windows = BrowserWindow.getAllWindows();
    windows.forEach((window) => window.destroy());
  });
});
