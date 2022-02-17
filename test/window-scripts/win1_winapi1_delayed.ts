import { exposeWindowApi } from "../../src/client_ipc";
import { ACCEPTABLE_DELAY_MILLIS } from "../lib/config";
import { WinApi1 } from "../api/winapi1";
import { restorer } from "../lib/shared_util";
import { sleep } from "../lib/shared_util";

(async () => {
  try {
    await sleep(ACCEPTABLE_DELAY_MILLIS * 0.8);
    exposeWindowApi(new WinApi1("win1"), restorer);
  } catch (err) {
    window.__ipc.send("test_aborted", err);
  }
})();
