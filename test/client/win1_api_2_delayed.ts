import { reportErrorsToMain, windowFinished } from "../lib/renderer_util";
import { INITIAL_DELAY_MILLIS } from "../lib/config";
import { sleep } from "../lib/shared_util";
import { callMainApi2 } from "./call_main_api_2";

(async () => {
  reportErrorsToMain("win1");
  await sleep(INITIAL_DELAY_MILLIS);
  await callMainApi2("win1");
  windowFinished();
})();
