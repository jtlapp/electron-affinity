import { ipcRenderer } from "electron";

import { callMainApi1 } from "./call_main_api_1";
import { callMainApi2 } from "./call_main_api_2";

(async () => {
  await callMainApi1("win2");
  await callMainApi2("win2");
  ipcRenderer.send("completed_all");
})();
