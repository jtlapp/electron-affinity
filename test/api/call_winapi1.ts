import { BrowserWindow } from "electron";

import { bindWindowApi } from "../../src/main";
import type { WinApi1 } from "../api/winapi1";
import { Catter } from "../lib/shared_util";

export async function callWindowApi1(window: BrowserWindow) {
  const windowApi1 = await bindWindowApi<WinApi1>(window, "WinApi1");

  windowApi1.sendNoParams();

  windowApi1.sendStringSameMethod("X");

  windowApi1.sendCoordinates(5, 10);

  windowApi1.sendCatter(new Catter("this", "that"));

  windowApi1.sendNull(null);

  windowApi1.sendTrue(true);

  windowApi1.sendArray(["foo", "bar"]);

  windowApi1.sendDate(new Date("January 1, 2021"));

  // try {
  //   fs.readFileSync("__nonexistant_file__");
  // } catch (err: any) {
  //   windowApi1.sendFSError(err);
  // }

  // windowApi1.sendCustomError(new CustomError("bad thing", 99));
}
