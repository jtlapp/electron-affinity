import { ipcRenderer } from "electron";

import { testEvent } from "../renderer";

testEvent("mainEvent", "mainEventTest");

ipcRenderer.on("completed_all", () => {
  ipcRenderer.send("completed_all");
});
