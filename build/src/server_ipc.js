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
exports.setIpcErrorLogger = exports.exposeMainApi = exports.RelayedError = void 0;
var electron_1 = require("electron");
var shared_ipc_1 = require("./shared_ipc");
var restorer_1 = require("./restorer");
var _listeningForIPC = false;
// Structure mapping API names to the methods each contains.
var _registrationMap = {};
// Structure tracking which windows have bound to which APIs before the
// window has been reloaded. After a window has reloaded, it is known that
// window is capable of binding to all APIs, and it's up to the window to
// be sure it rebinds all APIs, as main won't timeout for a reload.
var _boundApisByContentsID = {};
// Error logger mainly of value for debugging the test suite.
var _errorLoggerFunc;
/**
 * Wrapper for exceptions occurring in a main API that are relayed to the
 * caller in the calling window. Any uncaught exception of a main API not
 * of this type is throw within Electron and not returned to the window.
 */
var RelayedError = /** @class */ (function () {
    function RelayedError(errorToRelay) {
        this.errorToRelay = errorToRelay;
    }
    return RelayedError;
}());
exports.RelayedError = RelayedError;
/**
 * Exposes a main API to a particular window, which must bind to the API.
 * Failure of the window to bind before timeout results in an error.
 *
 * @param <T> (inferred type, not specified in call)
 * @param toWindow The window to which to expose the API
 * @param mainApi The API to expose to the window
 * @param restorer Optional function for restoring the classes of
 *    arguments passed to main. Instances of classes not restored arrive
 *    as untyped structures.
 */
function exposeMainApi(toWindow, mainApi, restorer) {
    var _this = this;
    var apiClassName = mainApi.constructor.name;
    if (!_listeningForIPC) {
        electron_1.ipcMain.on(shared_ipc_1.REQUEST_API_EVENT, function (event, apiClassName) {
            // Previously-bound APIs are known to be available after window reload.
            var windowApis = _boundApisByContentsID[event.sender.id];
            if (windowApis && windowApis[apiClassName]) {
                sendApiRegistration(event.sender, apiClassName);
            }
        });
        electron_1.ipcMain.on(shared_ipc_1.BOUND_API_EVENT, function (event, apiClassName) {
            var windowApis = _boundApisByContentsID[event.sender.id];
            if (windowApis === undefined) {
                windowApis = {};
                _boundApisByContentsID[event.sender.id] = windowApis;
            }
            windowApis[apiClassName] = true;
        });
        _listeningForIPC = true;
    }
    if (_registrationMap[apiClassName] === undefined) {
        var methodNames = [];
        var _loop_1 = function (methodName) {
            if (methodName != "constructor" && !["_", "#"].includes(methodName[0])) {
                var method_1 = mainApi[methodName];
                if (typeof method_1 == "function") {
                    electron_1.ipcMain.handle((0, shared_ipc_1.toIpcName)(apiClassName, methodName), function (_event, args) { return __awaiter(_this, void 0, void 0, function () {
                        var i, replyValue, err_1;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    if (restorer !== undefined && args !== undefined) {
                                        for (i = 0; i < args.length; ++i) {
                                            args[i] = restorer_1.Restorer.restoreValue(args[i], restorer);
                                        }
                                    }
                                    return [4 /*yield*/, method_1.bind(mainApi).apply(void 0, args)];
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
                    methodNames.push(methodName);
                }
            }
        };
        for (var _i = 0, _a = getPropertyNames(mainApi); _i < _a.length; _i++) {
            var methodName = _a[_i];
            _loop_1(methodName);
        }
        _registrationMap[apiClassName] = methodNames;
    }
    (0, shared_ipc_1.retryUntilTimeout)(0, function () {
        if (toWindow.isDestroyed()) {
            throw Error("Window destroyed before binding to '" + apiClassName + "'");
        }
        var windowApis = _boundApisByContentsID[toWindow.webContents.id];
        if (windowApis !== undefined && windowApis[apiClassName]) {
            return true;
        }
        sendApiRegistration(toWindow.webContents, apiClassName);
        return false;
    }, "Timed out waiting for main API '" + apiClassName + "' to bind to window " + toWindow.id);
}
exports.exposeMainApi = exposeMainApi;
// Returns all properties of the class not defined by JavaScript.
function getPropertyNames(obj) {
    var propertyNames = [];
    while (!Object.getOwnPropertyNames(obj).includes("hasOwnProperty")) {
        propertyNames.push.apply(propertyNames, Object.getOwnPropertyNames(obj));
        obj = Object.getPrototypeOf(obj);
    }
    return propertyNames;
}
// Send an API registration to a window.
function sendApiRegistration(toWebContents, apiClassName) {
    var registration = {
        className: apiClassName,
        methodNames: _registrationMap[apiClassName]
    };
    toWebContents.send(shared_ipc_1.EXPOSE_API_EVENT, registration);
}
/**
 * Receives errors thrown in APIs not wrapped in RelayedError.
 */
function setIpcErrorLogger(loggerFunc) {
    _errorLoggerFunc = loggerFunc;
}
exports.setIpcErrorLogger = setIpcErrorLogger;
/*
NOTE: I rejected the following more-flexible approach to exposing APIs
because it's awkward looking, which would be a barrier to adoption.
TypeScript does not (at present) provide a direct way to ensure that
every element of an array conforms to a particular structure while
also allowing the elements to have different properties. See:
https://github.com/microsoft/TypeScript/issues/7481#issuecomment-968220900
https://github.com/microsoft/TypeScript/issues/7481#issuecomment-1003504754

type CheckedApi = Record<string, (...args: any[]) => Promise<any>>;
function checkApi<T extends ElectronMainApi<T>>(api: T) {
  return api as CheckedApi;
}
class Api1 {
  async func1() {}
}
class Api2 {
  async func2() {}
}
function exposeApis(_apis: CheckedApi[]) {}
const api1 = new Api1();
const api2 = new Api2();
exposeApis([checkApi(api1), checkApi(api2)]);
*/
//# sourceMappingURL=server_ipc.js.map