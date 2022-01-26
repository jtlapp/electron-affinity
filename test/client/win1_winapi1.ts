import { exposeWindowApi } from "../../src/client_ipc";
import { WindowApi1 } from "../api/window_api_1";
import { restorer } from "../lib/shared_util";

exposeWindowApi(new WindowApi1(), restorer);
