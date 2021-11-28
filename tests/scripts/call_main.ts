import { ipcRenderer } from "electron";

import { ClientApi } from "../client_api";
import { sendCall } from "../renderer";

(async () => {
  await sendCall("test 42", () => {
    return ClientApi.doubleNumber(21);
  });
  ipcRenderer.send("terminate");
})();
