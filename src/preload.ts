/**
 * Installs the generic IPC on which APIs are built in the renderer.
 * The API methods cannot themselves be installed this way because
 * they require receiving class and method names via IPC, and because
 * they need to support parameterized construction.
 */

import { contextBridge } from "electron";
import { ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("_affinity_ipc", {
  invoke: (channel: string, data: any) => {
    return ipcRenderer.invoke(channel, data);
  },
  send: (channel: string, data: any) => {
    ipcRenderer.send(channel, data);
  },
  on: (channel: string, func: (data: any) => void) => {
    // Don't pass along event as it includes `sender`
    ipcRenderer.on(channel, (_event, args) => func(args));
  },
});
