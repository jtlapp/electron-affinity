import { Restorer } from "../../src/restorer";

// TODO: delete this
export function testEvent(eventName: string, testName: string) {
  window.__ipc.on(eventName, (args) => {
    testSend(testName, args);
  });
}

export async function testInvoke(
  testName: string,
  testFunc: () => Promise<any>
): Promise<void> {
  window.__ipc.send("started_test", testName);
  try {
    const replyData = await testFunc();
    window.__ipc.send("reply_data", Restorer.makeRestorable(replyData));
    window.__ipc.send("completed_test", null);
  } catch (err: any) {
    window.__ipc.send("completed_test", Restorer.makeReturnedError(err));
  }
}

export function testSend(testName: string, args: any) {
  window.__ipc.send("started_test", testName);
  try {
    Restorer.makeArgsRestorable(args);
    window.__ipc.send("request_data", args);
    window.__ipc.send("completed_test", null);
  } catch (err: any) {
    window.__ipc.send("completed_test", Restorer.makeReturnedError(err));
  }
}

export function reportErrorsToMain(winTag: string) {
  window.onerror = (message) => {
    window.__ipc.send("test_aborted", `${winTag}: ${message}`);
  };
}

export function windowFinished() {
  window.__ipc.send("completed_all", null);
}
