import { reportErrorsToMain, windowFinished } from "../lib/renderer_util";
import { callMainApi1 } from "../api/call_mainapi1";
import { callMainApi2 } from "../api/call_mainapi2";

(async () => {
  try {
    reportErrorsToMain("win1");
    await callMainApi1("win1");
    await callMainApi2("win1");
    windowFinished();
  } catch (err) {
    window._affinity_ipc.send("test_aborted", err);
  }
})();
