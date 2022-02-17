import { reportErrorsToMain, windowFinished } from "../lib/renderer_util";
import { callMainApi3 } from "../api/call_mainapi3";

(async () => {
  try {
    reportErrorsToMain("win1");
    await callMainApi3("win1");
    windowFinished();
  } catch (err) {
    window.__ipc.send("test_aborted", err);
  }
})();
