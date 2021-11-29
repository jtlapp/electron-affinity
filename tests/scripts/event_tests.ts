import { ipcRenderer } from "electron";

import { testEvent } from "../renderer";

testEvent("demo_event", "demoEventTest");

ipcRenderer.on("completed_all", () => {
  ipcRenderer.send("completed_all");
});
