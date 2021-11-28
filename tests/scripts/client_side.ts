import { ipcRenderer } from "electron";

import { ClientApi } from "../client_api";

(async () => {
  ipcRenderer.send("startingTest", "test 42");
  const doubled = await ClientApi.doubleNumber(21);
  ipcRenderer.send("replyData", doubled);
  ipcRenderer.send("completedTest");

  ipcRenderer.send("terminate");
})();
