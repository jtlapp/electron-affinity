import { ipcRenderer } from "electron";

import { callMainApi1 } from "./call_main_api_1";

(async () => {
  window.onerror = (message) => {
    ipcRenderer.send("test_aborted", "win1: " + message);
  };
  await callMainApi1("win1");
  ipcRenderer.send("completed_all");
})();
