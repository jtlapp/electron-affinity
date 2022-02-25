import { reportErrorsToMain, windowFinished } from "../lib/renderer_util";
import { callMainApi3B } from "../api/call_mainapi3b";

(async () => {
  try {
    reportErrorsToMain("win1");
    await callMainApi3B("win1");
    windowFinished();
  } catch (err) {
    window.__ipc.send("test_aborted", err);
  }
})();
