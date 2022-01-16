import { ipcRenderer } from "electron";

import { Restorer } from "../../src/restorer";

export function testEvent(eventName: string, testName: string) {
  ipcRenderer.on(eventName, (_event, args) => {
    ipcRenderer.send("started_test", testName);
    try {
      for (let i = 0; i < args.length; ++i) {
        args[i] = Restorer.makeRestorable(args[i]);
      }
      ipcRenderer.send("request_data", args);
      ipcRenderer.send("completed_test");
    } catch (err: any) {
      ipcRenderer.send("completed_test", Restorer.makeReturnedError(err));
    }
  });
}

export async function testInvoke(
  testName: string,
  testFunc: () => Promise<any>
): Promise<void> {
  ipcRenderer.send("started_test", testName);
  try {
    const replyData = await testFunc();
    ipcRenderer.send("reply_data", Restorer.makeRestorable(replyData));
    ipcRenderer.send("completed_test");
  } catch (err: any) {
    ipcRenderer.send("completed_test", Restorer.makeReturnedError(err));
  }
}

export function reportErrorsToMain(winTag: string) {
  window.onerror = (message) => {
    ipcRenderer.send("test_aborted", `${winTag}: ${message}`);
  };
}

export function windowFinished() {
  ipcRenderer.send("completed_all");
}
