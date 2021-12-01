import { ipcRenderer } from "electron";

import { ClientApi } from "../client_api";
import { testInvoke } from "../renderer";

(async () => {
  await testInvoke("test 42", () => {
    return ClientApi.doubleNumber(21);
  });
  await testInvoke("test FS error", () => {
    return ClientApi.throwFSError();
  });
  ipcRenderer.send("completed_all");
})();
