import { Restorer } from "../../src/restorer";

export async function testInvoke(
  testName: string,
  testFunc: () => Promise<any>
): Promise<void> {
  window.__ipc.send("started_test", testName);
  try {
    const returnValue = await testFunc();
    let replyData: string = typeof returnValue;
    if (replyData !== "undefined") {
      if (returnValue === null) {
        replyData = "null";
      } else {
        if (replyData == "object" && returnValue.constructor.name != "Object") {
          replyData = returnValue.constructor.name;
        }
        replyData += ":" + JSON.stringify(returnValue);
      }
    }
    window.__ipc.send("reply_data", replyData);
    window.__ipc.send("completed_test", null);
  } catch (err: any) {
    window.__ipc.send("completed_test", Restorer.makeRethrownReturnValue(err));
  }
}

export function testSend(testName: string, testResultsFunc: () => string[]) {
  window.__ipc.send("started_test", testName);
  try {
    window.__ipc.send("request_data_tests", testResultsFunc().join(";"));
    window.__ipc.send("completed_test", null);
  } catch (err: any) {
    window.__ipc.send("completed_test", Restorer.makeRethrownReturnValue(err));
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
