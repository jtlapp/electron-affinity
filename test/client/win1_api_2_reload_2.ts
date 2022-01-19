import { reportErrorsToMain, windowFinished } from "../lib/renderer_util";
import { callMainApi2 } from "./call_main_api_2";

(async () => {
  try {
    reportErrorsToMain("win1");
    await callMainApi2("win1");
    windowFinished();
  } catch (err) {
    window._ipc.send("test_aborted", err);
  }
})();
