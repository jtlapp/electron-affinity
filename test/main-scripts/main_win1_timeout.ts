import "source-map-support/register";

import { ACCEPTABLE_DELAY_MILLIS } from "../lib/config";
import { bindWindowApi, setIpcBindingTimeout } from "../../src/main";
import { createWindow } from "../lib/main_util";
import type { WinApi1 } from "../api/winapi1";
import { sleep } from "../lib/shared_util";

it("waits for main to timeout", async () => {
  const window1 = await createWindow();
  setIpcBindingTimeout(ACCEPTABLE_DELAY_MILLIS);
  bindWindowApi<WinApi1>(window1, "WinApi1");
  // Window doesn't provide the API for binding.
  await sleep(ACCEPTABLE_DELAY_MILLIS * 1.2);
  if (window1) window1.destroy();
});
