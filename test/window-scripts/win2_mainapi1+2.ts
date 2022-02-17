import { reportErrorsToMain, windowFinished } from "../lib/renderer_util";
import { callMainApi1 } from "../api/call_mainapi1";
import { callMainApi2 } from "../api/call_mainapi2";

(async () => {
  try {
    reportErrorsToMain("win2");
    await callMainApi1("win2");
    await callMainApi2("win2");
    windowFinished();
  } catch (err) {
    window.__ipc.send("test_aborted", err);
  }
})();
