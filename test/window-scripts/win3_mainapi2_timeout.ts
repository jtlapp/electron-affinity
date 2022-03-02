import { setIpcBindingTimeout } from "../../src/window";
import { ACCEPTABLE_DELAY_MILLIS } from "../lib/config";
import { reportErrorsToMain, windowFinished } from "../lib/renderer_util";
import { callMainApi2 } from "../api/call_mainapi2";

(async () => {
  try {
    reportErrorsToMain("win3");
    setIpcBindingTimeout(ACCEPTABLE_DELAY_MILLIS);
    await callMainApi2("win3");
    windowFinished();
  } catch (err) {
    window._affinity_ipc.send("test_aborted", err);
  }
})();
