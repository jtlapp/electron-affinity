import { exposeWindowApi } from "../../src/client_ipc";
import { WinApi1 } from "../api/winapi1";
import { restorer } from "../lib/shared_util";

exposeWindowApi(new WinApi1(), restorer);
