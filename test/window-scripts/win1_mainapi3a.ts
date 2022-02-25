import { reportErrorsToMain, windowFinished } from "../lib/renderer_util";
import { callMainApi3A } from "../api/call_mainapi3a";

(async () => {
  try {
    reportErrorsToMain("win1");
    await callMainApi3A("win1");
    windowFinished();
  } catch (err) {
    window.__ipc.send("test_aborted", err);
  }
})();
