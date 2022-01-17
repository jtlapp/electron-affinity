import { Restorer } from "../../src/restorer";

export function testEvent(eventName: string, testName: string) {
  window._ipc.on(eventName, (args) => {
    window._ipc.send("started_test", testName);
    try {
      for (let i = 0; i < args.length; ++i) {
        args[i] = Restorer.makeRestorable(args[i]);
      }
      window._ipc.send("request_data", args);
      window._ipc.send("completed_test", null);
    } catch (err: any) {
      window._ipc.send("completed_test", Restorer.makeReturnedError(err));
    }
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

export function reportErrorsToMain(winTag: string) {
  window.onerror = (message) => {
    window._ipc.send("test_aborted", `${winTag}: ${message}`);
  };
}

export function windowFinished() {
  window._ipc.send("completed_all", null);
}
