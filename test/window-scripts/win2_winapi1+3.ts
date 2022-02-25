import { exposeWindowApi } from "../../src/window";
import { WinApi1 } from "../api/winapi1";
import { WinApi3 } from "../api/winapi3";
import { restorer } from "../lib/shared_util";

exposeWindowApi(new WinApi1("win2"), restorer);
exposeWindowApi(new WinApi3("win2")); // no restorer
