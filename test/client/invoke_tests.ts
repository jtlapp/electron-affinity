import { ipcRenderer } from "electron";

import { bindIpcApi } from "../../src/client_ipc";
import { TestApi1 } from "../api/test_api_1";
import { TestApi2 } from "../api/test_api_2";
import { Catter, recoverClass } from "../api/classes";
import { testInvoke } from "../lib/renderer_util";

(async () => {
  const clientApi1 = await bindIpcApi<TestApi1>("TestApi1", recoverClass);
  const clientApi2 = await bindIpcApi<TestApi2>("TestApi2", recoverClass);

  // Invoke API 1

  await testInvoke("no reply no error", () => {
    return clientApi1.noReplyNoError();
  });
  await testInvoke("single param", () => {
    return clientApi1.doubleNumber(21);
  });
  await testInvoke("multi param", () => {
    return clientApi1.sumNumbers(5, 10);
  });
  await testInvoke("send class instance 1", () => {
    return clientApi1.sendCatter1(new Catter("this", "that"));
  });
  await testInvoke("get class instance 1", () => {
    return clientApi1.makeCatter1("this", "that");
  });
  await testInvoke("all good 1", () => {
    return clientApi1.allGoodOrNot1(true);
  });
  await testInvoke("plain error 1", () => {
    return clientApi1.allGoodOrNot1(false);
  });
  await testInvoke("same method api 1", () => {
    return clientApi1.sameMethodUniqueReply();
  });
  await testInvoke("structured error", () => {
    return clientApi1.throwFSError();
  });
  await testInvoke("custom error", () => {
    return clientApi1.throwCustomError("bad thing", 99);
  });

  // Invoke API 2

  await testInvoke("send class instance 2", () => {
    return clientApi2.sendCatter2(new Catter("this", "that"));
  });
  await testInvoke("get class instance 2", () => {
    return clientApi2.makeCatter2("this", "that");
  });
  await testInvoke("all good 2", () => {
    return clientApi2.allGoodOrNot2(true);
  });
  await testInvoke("plain error 2", () => {
    return clientApi2.allGoodOrNot2(false);
  });
  await testInvoke("same method api 2", () => {
    return clientApi2.sameMethodUniqueReply();
  });

  ipcRenderer.send("completed_all");
})();
