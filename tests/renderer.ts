import { ipcRenderer } from "electron";

export function testEvent(eventName: string, testName: string) {
  ipcRenderer.on(eventName, (_event, args) => {
    ipcRenderer.send("started_test", testName);
    try {
      ipcRenderer.send("request_data", args);
      ipcRenderer.send("completed_test");
    } catch (err) {
      ipcRenderer.send("completed_test", Object.assign({}, err));
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
    ipcRenderer.send("reply_data", replyData);
    ipcRenderer.send("completed_test");
  } catch (err) {
    ipcRenderer.send("completed_test", Object.assign({}, err));
  }
}
