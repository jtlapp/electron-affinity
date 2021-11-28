import { ipcRenderer } from "electron";

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
