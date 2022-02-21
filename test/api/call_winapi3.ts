import { BrowserWindow } from "electron";

import { bindWindowApi } from "../../src/main";
import type { WinApi3 } from "../api/winapi3";
import { Catter } from "../lib/shared_util";

export async function callWindowApi3(window: BrowserWindow) {
  const windowApi3 = await bindWindowApi<WinApi3>(window, "WinApi3");

  windowApi3.sendClassInstanceAsObject(new Catter("foo", "bar"));

  windowApi3.sendErrorAsArg(new Error("restored error"));
}
