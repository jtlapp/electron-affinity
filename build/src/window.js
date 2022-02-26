"use strict";
/**
 * Function and types available to windows in Electron.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
exports.__esModule = true;
exports.setIpcBindingTimeout = exports.bindMainApi = exports.checkWindowApi = exports.exposeWindowApi = void 0;
var client_ipc_1 = require("./lib/client_ipc");
__createBinding(exports, client_ipc_1, "exposeWindowApi");
__createBinding(exports, client_ipc_1, "checkWindowApi");
__createBinding(exports, client_ipc_1, "bindMainApi");
var shared_ipc_1 = require("./lib/shared_ipc");
__createBinding(exports, shared_ipc_1, "setIpcBindingTimeout");
//# sourceMappingURL=window.js.map