import { Restorer } from "../../src/lib/restorer_lib";

export async function testInvoke(
  testName: string,
  testFunc: () => Promise<any>
): Promise<void> {
  window._affinity_ipc.send("started_test", testName);
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
        if (returnValue instanceof Error) {
          // errors don't stringify
          replyData += ":" + returnValue.message;
          const code = (returnValue as any).code;
          if (code !== undefined) {
            replyData += ";" + code;
          }
        } else {
          replyData += ":" + JSON.stringify(returnValue);
        }
      }
    }
    window._affinity_ipc.send("reply_data", replyData);
    window._affinity_ipc.send("completed_test", null);
  } catch (err: any) {
    window._affinity_ipc.send(
      "completed_test",
      Restorer.makeRethrownReturnValue(err)
    );
  }
}

export function testSend(testName: string, testResultsFunc: () => string[]) {
  window._affinity_ipc.send("started_test", testName);
  try {
    window._affinity_ipc.send(
      "request_data_tests",
      testResultsFunc().join(";")
    );
    window._affinity_ipc.send("completed_test", null);
  } catch (err: any) {
    window._affinity_ipc.send(
      "completed_test",
      Restorer.makeRethrownReturnValue(err)
    );
  }
}

export function reportErrorsToMain(winTag: string) {
  window.onerror = (message) => {
    window._affinity_ipc.send("test_aborted", `${winTag}: ${message}`);
  };
}

export function windowFinished() {
  window._affinity_ipc.send("completed_all", null);
}
