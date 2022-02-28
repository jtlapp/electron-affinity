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
exports.bindWindowApi = exports.setIpcErrorLogger = exports.exposeMainApi = exports.RelayedError = exports.checkMainApi = void 0;
var electron_1 = require("electron");
var shared_ipc_1 = require("./shared_ipc");
var restorer_1 = require("./restorer");
//// MAIN API SUPPORT ////////////////////////////////////////////////////////
// Structure mapping API names to the methods each contains.
var _mainApiMap = {};
// Error logger mainly of value for debugging the test suite.
var _errorLoggerFunc;
/**
 * Type checks the argument to ensure it conforms with `ElectronMainApi`,
 * and returns the argument for the convenience of the caller.
 *
 * @param <T> (inferred type, not specified in call)
 * @param api Instance of the main API class to type check
 * @return The provided main API
 * @see ElectronMainApi
 */
function checkMainApi(api) {
    return api;
}
exports.checkMainApi = checkMainApi;
/**
 * Class that wraps exceptions occurring in a main API that are to be
 * relayed as errors back to the calling window. A main API wishing to
 * have an exception thrown in the calling window wraps the error object
 * in an instance of this class and throws the instance. The main process
 * will ignore the throw except for transferring it to the calling window.
 * Exceptions thrown within a main API not wrapped in `RelayedError` are
 * thrown within the main process as "uncaught" exceptions.
 *
 * @param errorToRelay The error to throw within the calling window,
 *    occurring within the window's call to the main API
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
 * @param mainApi The API to expose to all windows, which must be an
 *    instance of a class conforming to type `ElectronMainApi`
 * @param restorer Optional function for restoring the classes of
 *    arguments passed to APIs from the window. Arguments not
 *    restored to original classes arrive as untyped objects.
 */
function exposeMainApi(mainApi, restorer) {
    var _this = this;
    _installIpcListeners();
    (0, shared_ipc_1.exposeApi)(_mainApiMap, mainApi, function (ipcName, method) {
        electron_1.ipcMain.handle(ipcName, function (_event, args) { return __awaiter(_this, void 0, void 0, function () {
            var returnValue, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        restorer_1.Restorer.restoreArgs(args, restorer);
                        return [4 /*yield*/, method.bind(mainApi).apply(void 0, args)];
                    case 1:
                        returnValue = _a.sent();
                        if (returnValue instanceof RelayedError) {
                            throw new Error("RelayedError must be thrown, not returned");
                        }
                        return [2 /*return*/, [returnValue, restorer_1.Restorer.makeRestorationInfo(returnValue)]];
                    case 2:
                        err_1 = _a.sent();
                        if (err_1 instanceof RelayedError) {
                            return [2 /*return*/, restorer_1.Restorer.makeRethrownReturnValue(err_1.errorToRelay)];
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
// Receives exceptions thrown in main APIs that were not wrapped in RelayedError.
function setIpcErrorLogger(loggerFunc) {
    _errorLoggerFunc = loggerFunc;
}
exports.setIpcErrorLogger = setIpcErrorLogger;
// Structure mapping window API names to the methods they contain, indexed by
// web contents ID.
var _windowApiMapByWebContentsID = {};
// Structure tracking bound window APIs, indexed by window ID.
var _boundWindowApisByWindowID = {};
/**
 * Returns a main-side binding for a window API of a given class, restricting
 * the binding to the given window. Failure of the window to expose the API
 * before timeout results in an exception. There is a default timeout, but
 * you can override it with `setIpcBindingTimeout()`. (The function takes no
 * restorer parameter because window APIs do not return values.)
 *
 * @param <T> Type of the window API class to bind
 * @param window Window to which to bind the window API
 * @param apiClassName Name of the class being bound. Must be identical to
 *    the name of class T. Provides runtime information that <T> does not.
 * @returns An API of type T that can be called as if T were local to the
 *    main process.
 * @see setIpcBindingTimeout
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
    // Wait for the window API binding to arrive.
    var windowID = window.webContents.id; // save in case window is destroyed
    var windowApiMap = _windowApiMapByWebContentsID[windowID];
    if (!windowApiMap || !windowApiMap[apiClassName]) {
        // Keep trying until window loads and initializes enough to receive request.
        window.webContents.send(shared_ipc_1.API_REQUEST_IPC, apiClassName);
        return false;
    }
    // Construct the window API binding.
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
    // Save the binding to return on duplicate binding requests.
    var windowApis = _boundWindowApisByWindowID[windowID];
    if (!windowApis) {
        windowApis = {};
        _boundWindowApisByWindowID[windowID] = windowApis;
    }
    windowApis[apiClassName] = boundApi;
    // Uninstall the binding when the window closes.
    window.on("closed", function (_event) {
        for (var _i = 0, methodNames_2 = methodNames; _i < methodNames_2.length; _i++) {
            var methodName = methodNames_2[_i];
            var typedMethodName = methodName;
            boundApi[typedMethodName] = (function () {
                var _args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    _args[_i] = arguments[_i];
                }
                throw Error("Window has closed; API unavailable");
            }); // typescript can't confirm the method signature
        }
        // Deleting more than once doesn't cause an error.
        delete _boundWindowApisByWindowID[windowID];
    });
    // Return the binding to main.
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