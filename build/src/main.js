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
exports.genericRestorer = exports.setIpcBindingTimeout = exports.RelayedError = exports.bindWindowApi = exports.checkMainApiClass = exports.checkMainApi = exports.exposeMainApi = void 0;
var server_ipc_1 = require("./lib/server_ipc");
__createBinding(exports, server_ipc_1, "exposeMainApi");
__createBinding(exports, server_ipc_1, "checkMainApi");
__createBinding(exports, server_ipc_1, "checkMainApiClass");
__createBinding(exports, server_ipc_1, "bindWindowApi");
__createBinding(exports, server_ipc_1, "RelayedError");
var shared_ipc_1 = require("./lib/shared_ipc");
__createBinding(exports, shared_ipc_1, "setIpcBindingTimeout");
var restorer_1 = require("./lib/restorer");
__createBinding(exports, restorer_1, "genericRestorer");
//# sourceMappingURL=main.js.map