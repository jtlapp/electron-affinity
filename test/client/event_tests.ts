import { testEvent } from "../lib/renderer_util";

testEvent("demo_event", "demoEventTest");

window.ipc.on("completed_all", () => {
  window.ipc.send("completed_all", null);
});
