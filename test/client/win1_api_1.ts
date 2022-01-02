import { ipcRenderer } from "electron";

import { callMainApi1 } from "./call_main_api_1";

(async () => {
  await callMainApi1("win1");
  ipcRenderer.send("completed_all");
})();
