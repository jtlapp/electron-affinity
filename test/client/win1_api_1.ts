import { reportErrorsToMain, windowFinished } from "../lib/renderer_util";
import { callMainApi1 } from "./call_main_api_1";

(async () => {
  reportErrorsToMain("win1");
  await callMainApi1("win1");
  windowFinished();
})();
