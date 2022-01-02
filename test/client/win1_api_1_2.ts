import { reportErrorsToMain, windowFinished } from "../lib/renderer_util";
import { callMainApi1 } from "./call_main_api_1";
import { callMainApi2 } from "./call_main_api_2";

(async () => {
  reportErrorsToMain("win1");
  await callMainApi1("win1");
  await callMainApi2("win1");
  windowFinished();
})();
