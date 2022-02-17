import { bindWindowApi } from "../../src/main";
import { createWindow } from "../lib/main_util";
import type { WinApi1 } from "../api/winapi1";

it("waits for main to timeout, default timeout", async () => {
  const window1 = await createWindow();
  await bindWindowApi<WinApi1>(window1, "WinApi1");
  window1.destroy();
});
