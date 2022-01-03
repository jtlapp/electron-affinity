import { setIpcBindingTimeout } from "../../src";
import { MAIN_INITIAL_DELAY_MILLIS } from "../lib/config";
import { reportErrorsToMain, windowFinished } from "../lib/renderer_util";
import { callMainApi2 } from "./call_main_api_2";

(async () => {
  reportErrorsToMain("win2");
  setIpcBindingTimeout(MAIN_INITIAL_DELAY_MILLIS + 1000);
  await callMainApi2("win2");
  windowFinished();
})();
