import { Restorer } from "../../src/restorer";

// TODO: delete this
export function testEvent(eventName: string, testName: string) {
  window._ipc.on(eventName, (args) => {
    testSend(testName, args);
  });
}

export async function testInvoke(
  testName: string,
  testFunc: () => Promise<any>
): Promise<void> {
  window._ipc.send("started_test", testName);
  try {
    const replyData = await testFunc();
    window._ipc.send("reply_data", Restorer.makeRestorable(replyData));
    window._ipc.send("completed_test", null);
  } catch (err: any) {
    window._ipc.send("completed_test", Restorer.makeReturnedError(err));
  }
}

export function testSend(testName: string, args: any) {
  window._ipc.send("started_test", testName);
  try {
    Restorer.makeArgsRestorable(args);
    window._ipc.send("request_data", args);
    window._ipc.send("completed_test", null);
  } catch (err: any) {
    window._ipc.send("completed_test", Restorer.makeReturnedError(err));
  }
}

export function reportErrorsToMain(winTag: string) {
  window.onerror = (message) => {
    window._ipc.send("test_aborted", `${winTag}: ${message}`);
  };
}

export function windowFinished() {
  window._ipc.send("completed_all", null);
}
