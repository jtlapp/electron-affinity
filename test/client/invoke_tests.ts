import { ipcRenderer } from "electron";

import { bindIpcApi } from "../../src/client_ipc";
import { TestApi1 } from "../api/test_api_1";
import { Catter, recoverClass } from "../api/classes";
import { testInvoke } from "../lib/renderer_util";

(async () => {
  const clientApi = await bindIpcApi<TestApi1>("TestApi1", recoverClass);

  await testInvoke("no reply no error", () => {
    return clientApi.noReplyNoError();
  });
  await testInvoke("single param", () => {
    return clientApi.doubleNumber(21);
  });
  await testInvoke("multi param", () => {
    return clientApi.sumNumbers(5, 10);
  });
  await testInvoke("send class instance", () => {
    return clientApi.sendCatter(new Catter("this", "that"));
  });
  await testInvoke("get class instance", () => {
    return clientApi.makeCatter("this", "that");
  });
  await testInvoke("all good", () => {
    return clientApi.allGoodOrNot(true);
  });
  await testInvoke("plain error", () => {
    return clientApi.allGoodOrNot(false);
  });
  await testInvoke("structured error", () => {
    return clientApi.throwFSError();
  });
  await testInvoke("custom error", () => {
    return clientApi.throwCustomError("bad thing", 99);
  });
  ipcRenderer.send("completed_all");
})();
