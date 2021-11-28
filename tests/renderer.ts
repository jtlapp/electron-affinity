import { ipcRenderer } from "electron";

export function receiveCall(eventName: string, testName: string) {
  ipcRenderer.on(eventName, (_event, args) => {
    ipcRenderer.send("startingTest", testName);
    try {
      ipcRenderer.send("requestData", args);
      ipcRenderer.send("completedTest");
    } catch (err) {
      ipcRenderer.send("completedTest", err);
    }
  });
}

export async function sendCall(
  testName: string,
  testFunc: () => Promise<any>
): Promise<void> {
  ipcRenderer.send("startingTest", testName);
  try {
    const replyData = await testFunc();
    ipcRenderer.send("replyData", replyData);
    ipcRenderer.send("completedTest");
  } catch (err) {
    ipcRenderer.send("completedTest", err);
  }
}
