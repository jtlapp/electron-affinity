import { BrowserWindow } from "electron";

import { bindWindowApi } from "../../src/main";
import type { WindowApi1 } from "../api/window_api_1";
import { Catter } from "../lib/shared_util";
export async function callWindowApi1(window: BrowserWindow) {
  const windowApi1 = await bindWindowApi<WindowApi1>(window, "WindowApi1");

  windowApi1.sendNoParams();

  windowApi1.sendCoordinates(5, 10);

  windowApi1.sendCatter(new Catter("this", "that"));

  // windowApi1.sendReceiveDate(new Date("January 1, 2021"));

  // try {
  //   fs.readFileSync("__nonexistant_file__");
  // } catch (err: any) {
  //   windowApi1.sendFSError(err);
  // }

  // windowApi1.sendCustomError(new CustomError("bad thing", 99));
}
