import { setIpcBindingTimeout } from "../../src/shared_ipc";
import { ACCEPTABLE_DELAY_MILLIS } from "../lib/config";
import { reportErrorsToMain, windowFinished } from "../lib/renderer_util";
import { callMainApi2 } from "./call_main_api_2";

(async () => {
  try {
    reportErrorsToMain("win1");
    setIpcBindingTimeout(ACCEPTABLE_DELAY_MILLIS);
    await callMainApi2("win1");
    windowFinished();
  } catch (err) {
    window._ipc.send("test_aborted", err);
  }
})();
