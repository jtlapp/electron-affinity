import { ipcRenderer } from "electron";

import { ClientApi } from "../api/client_api";
import { testInvoke } from "../lib/renderer_util";

(async () => {
  await testInvoke("test 42", () => {
    return ClientApi.doubleNumber(21);
  });
  await testInvoke("test FS error", () => {
    return ClientApi.throwFSError();
  });
  ipcRenderer.send("completed_all");
})();
