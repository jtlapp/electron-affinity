"use strict";
/**
 * Code specific to handling IPC in the main process.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.bindWindowApi = exports.setIpcErrorLogger = exports.exposeMainApi = exports.RelayedError = void 0;
var electron_1 = require("electron");
var shared_ipc_1 = require("./shared_ipc");
var restorer_1 = require("./restorer");
//// MAIN API SUPPORT ////////////////////////////////////////////////////////
// Structure mapping API names to the methods each contains.
var _mainApiMap = {};
// Error logger mainly of value for debugging the test suite.
var _errorLoggerFunc;
/**
 * Wrapper for exceptions occurring in a main API that are to be relayed
 * as errors back to the calling window. Any uncaught exception of a main API
 * not of this type is throw within Electron and not returned to the window.
 */
var RelayedError = /** @class */ (function () {
    function RelayedError(errorToRelay) {
        this.errorToRelay = errorToRelay;
    }
    return RelayedError;
}());
exports.RelayedError = RelayedError;
/**
 * Exposes a main API to all windows for possible binding.
 *
 * @param <T> (inferred type, not specified in call)
 * @param mainApi The API to expose
 * @param restorer Optional function for restoring the classes of
 *    arguments passed to main. Instances of classes not restored arrive
 *    as untyped structures.
 */
function exposeMainApi(mainApi, restorer) {
    var _this = this;
    _installIpcListeners();
    (0, shared_ipc_1.exposeApi)(_mainApiMap, mainApi, function (ipcName, method) {
        electron_1.ipcMain.handle(ipcName, function (_event, args) { return __awaiter(_this, void 0, void 0, function () {
            var replyValue, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        restorer_1.Restorer.restoreArgs(args, restorer);
                        return [4 /*yield*/, method.bind(mainApi).apply(void 0, args)];
                    case 1:
                        replyValue = _a.sent();
                        return [2 /*return*/, restorer_1.Restorer.makeRestorable(replyValue)];
                    case 2:
                        err_1 = _a.sent();
                        if (err_1 instanceof RelayedError) {
                            return [2 /*return*/, restorer_1.Restorer.makeReturnedError(err_1.errorToRelay)];
                        }
                        if (_errorLoggerFunc !== undefined) {
                            _errorLoggerFunc(err_1);
                        }
                        throw err_1;
                    case 3: return [2 /*return*/];
                }
            });
        }); });
    });
}
exports.exposeMainApi = exposeMainApi;
/**
 * Receives errors thrown in main APIs that were not wrapped in RelayedError.
 */
function setIpcErrorLogger(loggerFunc) {
    _errorLoggerFunc = loggerFunc;
}
exports.setIpcErrorLogger = setIpcErrorLogger;
//// WINDOW API SUPPORT //////////////////////////////////////////////////////
// TODO: purge window data when window closes
// Structure mapping window API names to the methods they contain, indexed by
// web contents ID.
var _windowApiMapByWebContentsID = {};
// Structure tracking bound window APIs, indexed by window ID.
// TODO: Can I replace WindowApiBinding<any> with 'true'?
var _boundWindowApisByWindowID = {};
/**
 * Returns a main-side binding for a window API of a given class, restricting
 * the binding to the given window. Failure of the window to expose the API
 * before timeout results in an error. There is a default timeout, but you
 * can override it with `setIpcBindingTimeout()`.
 *
 * @param <T> Class to which to bind.
 * @param apiClassName Name of the class being bound. Must be identical to
 *    the name of class T. Provides runtime information that <T> does not.
 * @returns An API of type T that can be called as if T were local.
 */
function bindWindowApi(window, apiClassName) {
    _installIpcListeners();
    return new Promise(function (resolve) {
        var windowApis = _boundWindowApisByWindowID[window.webContents.id];
        if (windowApis && windowApis[apiClassName]) {
            resolve(windowApis[apiClassName]);
        }
        else {
            (0, shared_ipc_1.retryUntilTimeout)(0, function () {
                return _attemptBindWindowApi(window, apiClassName, resolve);
            }, "Main timed out waiting to bind to window API '".concat(apiClassName, "'") +
                " (window ID ".concat(window.id, ")"));
        }
    });
}
exports.bindWindowApi = bindWindowApi;
// Implements a single attempt to bind to a window API.
function _attemptBindWindowApi(window, apiClassName, resolve) {
    var windowApiMap = _windowApiMapByWebContentsID[window.webContents.id];
    if (!windowApiMap || !windowApiMap[apiClassName]) {
        // Keep trying until window loads and initializes enough to receive request.
        window.webContents.send(shared_ipc_1.API_REQUEST_IPC, apiClassName);
        return false;
    }
    var methodNames = windowApiMap[apiClassName];
    var boundApi = {};
    var _loop_1 = function (methodName) {
        var typedMethodName = methodName;
        boundApi[typedMethodName] = (function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            restorer_1.Restorer.makeArgsRestorable(args);
            window.webContents.send((0, shared_ipc_1.toIpcName)(apiClassName, methodName), args);
        }); // typescript can't confirm the method signature
    };
    for (var _i = 0, methodNames_1 = methodNames; _i < methodNames_1.length; _i++) {
        var methodName = methodNames_1[_i];
        _loop_1(methodName);
    }
    var windowApis = _boundWindowApisByWindowID[window.webContents.id];
    if (!windowApis) {
        windowApis = {};
        _boundWindowApisByWindowID[window.webContents.id] = windowApis;
    }
    windowApis[apiClassName] = boundApi;
    resolve(boundApi);
    return true;
}
//// COMMON MAIN & WINDOW SUPPORT API ////////////////////////////////////////
var _listeningForIPC = false;
function _installIpcListeners() {
    if (!_listeningForIPC) {
        electron_1.ipcMain.on(shared_ipc_1.API_REQUEST_IPC, function (event, apiClassName) {
            var registration = {
                className: apiClassName,
                methodNames: _mainApiMap[apiClassName]
            };
            event.sender.send(shared_ipc_1.API_RESPONSE_IPC, registration);
        });
        electron_1.ipcMain.on(shared_ipc_1.API_RESPONSE_IPC, function (event, api) {
            var windowApiMap = _windowApiMapByWebContentsID[event.sender.id];
            if (!windowApiMap) {
                windowApiMap = {};
                _windowApiMapByWebContentsID[event.sender.id] = windowApiMap;
            }
            windowApiMap[api.className] = api.methodNames;
        });
        _listeningForIPC = true;
    }
}
//# sourceMappingURL=server_ipc.js.map