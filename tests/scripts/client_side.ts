import { ipcRenderer } from "electron";

import { ClientApi } from "../client_api";

const doubled = ClientApi.doubleNumber(21);
ipcRenderer.send("result", doubled);
