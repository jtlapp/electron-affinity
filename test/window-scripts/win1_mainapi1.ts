import { reportErrorsToMain, windowFinished } from "../lib/renderer_util";
import { callMainApi1 } from "../api/call_mainapi1";

(async () => {
  try {
    reportErrorsToMain("win1");
    await callMainApi1("win1");
    windowFinished();
  } catch (err) {
    window._ipc.send("test_aborted", err);
  }
})();
