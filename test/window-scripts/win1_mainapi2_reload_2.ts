import { reportErrorsToMain, windowFinished } from "../lib/renderer_util";
import { callMainApi2 } from "../api/call_mainapi2";

(async () => {
  try {
    reportErrorsToMain("win1");
    await callMainApi2("win1");
    windowFinished();
  } catch (err) {
    window._ipc.send("test_aborted", err);
  }
})();
