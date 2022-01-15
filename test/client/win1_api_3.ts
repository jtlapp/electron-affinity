import { reportErrorsToMain, windowFinished } from "../lib/renderer_util";
import { callMainApi3 } from "./call_main_api_3";

(async () => {
  reportErrorsToMain("win1");
  await callMainApi3("win1");
  windowFinished();
})();
