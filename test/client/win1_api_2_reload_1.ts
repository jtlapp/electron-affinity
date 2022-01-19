import { bindMainApi } from "../../src/window";
import type { MainApi2 } from "../api/main_api_2";
import { WINDOW_LOADED, restorer } from "../lib/shared_util";
import { reportErrorsToMain } from "../lib/renderer_util";

(async () => {
  try {
    reportErrorsToMain("win1");
    await bindMainApi<MainApi2>("MainApi2", restorer);
    await window._ipc.invoke(WINDOW_LOADED);
    window.location.reload();
  } catch (err) {
    window._ipc.send("test_aborted", err);
  }
})();
