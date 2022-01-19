"use strict";
/**
 * Function and types available to the Electron main process.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
exports.__esModule = true;
exports.setIpcBindingTimeout = exports.RelayedError = exports.exposeMainApi = void 0;
var server_ipc_1 = require("./server_ipc");
__createBinding(exports, server_ipc_1, "exposeMainApi");
__createBinding(exports, server_ipc_1, "RelayedError");
var shared_ipc_1 = require("./shared_ipc");
__createBinding(exports, shared_ipc_1, "setIpcBindingTimeout");
//# sourceMappingURL=main.js.map