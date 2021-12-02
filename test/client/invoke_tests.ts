import { ipcRenderer } from "electron";

import { ClientApi } from "../api/client_api";
import { testInvoke } from "../lib/renderer_util";

(async () => {
  await testInvoke("single param", () => {
    return ClientApi.doubleNumber(21);
  });
  await testInvoke("multi param", () => {
    return ClientApi.sumNumbers(5, 10);
  });
  await testInvoke("structured error", () => {
    return ClientApi.throwFSError();
  });
  ipcRenderer.send("completed_all");
})();
