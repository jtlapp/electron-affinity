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
exports.genericRestorer = exports.setIpcBindingTimeout = exports.bindMainApi = exports.checkWindowApiClass = exports.checkWindowApi = exports.exposeWindowApi = void 0;
var window_lib_1 = require("./lib/window_lib");
__createBinding(exports, window_lib_1, "exposeWindowApi");
__createBinding(exports, window_lib_1, "checkWindowApi");
__createBinding(exports, window_lib_1, "checkWindowApiClass");
__createBinding(exports, window_lib_1, "bindMainApi");
var shared_lib_1 = require("./lib/shared_lib");
__createBinding(exports, shared_lib_1, "setIpcBindingTimeout");
var restorer_lib_1 = require("./lib/restorer_lib");
__createBinding(exports, restorer_lib_1, "genericRestorer");
//# sourceMappingURL=window.js.map