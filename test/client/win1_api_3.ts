import { reportErrorsToMain, windowFinished } from "../lib/renderer_util";
import { callMainApi3 } from "./call_main_api_3";

(async () => {
  try {
    reportErrorsToMain("win1");
    await callMainApi3("win1");
    windowFinished();
  } catch (err) {
    window._ipc.send("test_aborted", err);
  }
})();
