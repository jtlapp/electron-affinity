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
var main_lib_1 = require("./lib/main_lib");
__createBinding(exports, main_lib_1, "exposeMainApi");
__createBinding(exports, main_lib_1, "checkMainApi");
__createBinding(exports, main_lib_1, "checkMainApiClass");
__createBinding(exports, main_lib_1, "bindWindowApi");
__createBinding(exports, main_lib_1, "RelayedError");
var shared_lib_1 = require("./lib/shared_lib");
__createBinding(exports, shared_lib_1, "setIpcBindingTimeout");
var restorer_lib_1 = require("./lib/restorer_lib");
__createBinding(exports, restorer_lib_1, "genericRestorer");
//# sourceMappingURL=main.js.map