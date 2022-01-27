import { bindMainApi } from "../../src/window";
import type { MainApi2 } from "../api/mainapi2";
import { restorer } from "../lib/shared_util";
import { reportErrorsToMain } from "../lib/renderer_util";

(async () => {
  try {
    reportErrorsToMain("win1");
    await bindMainApi<MainApi2>("MainApi2", restorer);
    window.location.reload();
  } catch (err) {
    window._ipc.send("test_aborted", err);
  }
})();
