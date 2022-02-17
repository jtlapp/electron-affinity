import { bindWindowApi } from "../../src/main";
import { createWindow, createResultCollector } from "../lib/main_util";
import type { WinApi1 } from "../api/winapi1";
import { restorer } from "../lib/shared_util";

const resultCollector = createResultCollector(restorer);

it("throws on calling a closed window", async () => {
  const window1 = await createWindow();
  resultCollector.runScripFiletInWindow(window1, "win1_winapi1");
  const windowApi1 = await bindWindowApi<WinApi1>(window1, "WinApi1");
  window1.destroy();
  windowApi1.sendNoParams();
});
