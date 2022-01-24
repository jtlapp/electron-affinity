export abstract class TestableWindowApi {
  _reportReceivedData(testName: string, ...args: any[]) {
    window._ipc.send("started_test", testName);
    window._ipc.send("request_data", args);
    window._ipc.send("completed_test", null);
  }
}
