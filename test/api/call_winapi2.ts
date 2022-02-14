import { BrowserWindow } from "electron";

import { bindWindowApi } from "../../src/main";
import type { WinApi2 } from "../api/winapi2";
import { Catter } from "../lib/shared_util";

export async function callWindowApi2(window: BrowserWindow) {
  const windowApi2 = await bindWindowApi<WinApi2>(window, "WinApi2");

  windowApi2.sendStringSameMethod("Y");

  windowApi2.sendCatter2(new Catter("foo", "bar"));
}
