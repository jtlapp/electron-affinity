"use strict";
exports.__esModule = true;
var electron_1 = require("electron");
var electron_2 = require("electron");
electron_1.contextBridge.exposeInMainWorld("ipc", {
    invoke: function (channel, data) {
        return electron_2.ipcRenderer.invoke(channel, data);
    },
    send: function (channel, data) {
        electron_2.ipcRenderer.send(channel, data);
    },
    on: function (channel, func) {
        // Don't pass along event as it includes `sender`
        electron_2.ipcRenderer.on(channel, function (_event, args) { return func(args); });
    }
});
//# sourceMappingURL=preload.js.map