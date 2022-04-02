import { exposeWindowApi, checkWindowApi } from "../../src/window";
import { WinApi1 } from "../api/winapi1";
import { restorer, assertIdentical } from "../lib/shared_util";

const winApi1 = new WinApi1("win1");
assertIdentical(winApi1, checkWindowApi(winApi1));

exposeWindowApi(winApi1, restorer);
