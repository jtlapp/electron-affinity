import { ipcRenderer } from "electron";

import { testEvent } from "../lib/renderer_util";

testEvent("demo_event", "demoEventTest");

ipcRenderer.on("completed_all", () => {
  ipcRenderer.send("completed_all");
});
