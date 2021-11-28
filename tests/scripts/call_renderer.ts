import { ipcRenderer } from "electron";

import { receiveCall } from "../renderer";

receiveCall("mainEvent", "mainEventTest");

ipcRenderer.on("completedAll", () => {
  ipcRenderer.send("terminate");
});
