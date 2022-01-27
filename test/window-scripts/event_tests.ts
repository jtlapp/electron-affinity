import { testEvent } from "../lib/renderer_util";

testEvent("demo_event", "demoEventTest");

window._ipc.on("completed_all", () => {
  window._ipc.send("completed_all", null);
});
