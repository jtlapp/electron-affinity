import { ipcRenderer } from "electron";

import { ClientApi } from "../api/client_api";
import { Catter } from "../api/classes";
import { testInvoke } from "../lib/renderer_util";

(async () => {
  await testInvoke("no reply no error", () => {
    return ClientApi.noReplyNoError();
  });
  await testInvoke("single param", () => {
    return ClientApi.doubleNumber(21);
  });
  await testInvoke("multi param", () => {
    return ClientApi.sumNumbers(5, 10);
  });
  await testInvoke("send class instance", () => {
    return ClientApi.sendCatter(new Catter("this", "that"));
  });
  await testInvoke("get class instance", () => {
    return ClientApi.makeCatter("this", "that");
  });
  await testInvoke("all good", () => {
    return ClientApi.allGoodOrNot(true);
  });
  await testInvoke("plain error", () => {
    return ClientApi.allGoodOrNot(false);
  });
  await testInvoke("structured error", () => {
    return ClientApi.throwFSError();
  });
  await testInvoke("custom error", () => {
    return ClientApi.throwCustomError("bad thing", 99);
  });
  ipcRenderer.send("completed_all");
})();
