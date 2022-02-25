import { exposeWindowApi } from "../../src/window";
import { WinApi1 } from "../api/winapi1";
import { WinApi2 } from "../api/winapi2";
import { restorer } from "../lib/shared_util";

exposeWindowApi(new WinApi1("win1"), restorer);
exposeWindowApi(new WinApi2("win1"), restorer);
