"use strict";
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
exports.setIpcErrorLogger = exports.exposeMainApi = void 0;
var electron_1 = require("electron");
var shared_ipc_1 = require("./shared_ipc");
var recovery_1 = require("./recovery");
var _registrationMap = {};
var _boundApisByWindowID = {};
/*
I rejected the following more-flexible approach to exposing APIs
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
function exposeMainApi(toWindow, mainApi, recoveryFunc) {
    var _this = this;
    var apiClassName = mainApi.constructor.name;
    if (Object.keys(_registrationMap).length == 0) {
        electron_1.ipcMain.on(shared_ipc_1.BOUND_API_EVENT, function (_event, binding) {
            var windowApis = _boundApisByWindowID[binding.windowID];
            if (windowApis === undefined) {
                windowApis = {};
                _boundApisByWindowID[binding.windowID] = windowApis;
            }
            windowApis[binding.className] = true;
        });
    }
    if (_registrationMap[apiClassName] === undefined) {
        var methodNames = [];
        var _loop_1 = function (methodName) {
            if (methodName[0] != "_" && methodName[0] != "#") {
                var method_1 = mainApi[methodName];
                if (typeof method_1 == "function") {
                    electron_1.ipcMain.handle((0, shared_ipc_1.toIpcName)(apiClassName, methodName), function (_event, args) { return __awaiter(_this, void 0, void 0, function () {
                        var i, replyValue, err_1;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    if (recoveryFunc !== undefined && args !== undefined) {
                                        for (i = 0; i < args.length; ++i) {
                                            args[i] = recovery_1.Recovery.recoverArgument(args[i], recoveryFunc);
                                        }
                                    }
                                    return [4 /*yield*/, method_1.bind(mainApi).apply(void 0, args)];
                                case 1:
                                    replyValue = _a.sent();
                                    return [2 /*return*/, recovery_1.Recovery.prepareArgument(replyValue)];
                                case 2:
                                    err_1 = _a.sent();
                                    if (_errorLoggerFunc !== undefined) {
                                        _errorLoggerFunc(err_1);
                                    }
                                    return [2 /*return*/, recovery_1.Recovery.prepareThrownError(err_1)];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    methodNames.push(methodName);
                }
            }
        };
        for (var methodName in mainApi) {
            _loop_1(methodName);
        }
        _registrationMap[apiClassName] = methodNames;
    }
    (0, shared_ipc_1.retryUntilTimeout)(0, function () {
        if (toWindow.isDestroyed()) {
            throw Error("Window destroyed before binding to '" + apiClassName + "'");
        }
        var windowApis = _boundApisByWindowID[toWindow.id];
        if (windowApis !== undefined && windowApis[apiClassName]) {
            return true;
        }
        var registration = {
            windowID: toWindow.id,
            className: apiClassName,
            methodNames: _registrationMap[apiClassName]
        };
        toWindow.webContents.send(shared_ipc_1.EXPOSE_API_EVENT, registration);
        return false;
    }, "Timed out waiting for main API '" + apiClassName + "' to bind to window " + toWindow.id);
}
exports.exposeMainApi = exposeMainApi;
var _errorLoggerFunc;
function setIpcErrorLogger(loggerFunc) {
    _errorLoggerFunc = loggerFunc;
}
exports.setIpcErrorLogger = setIpcErrorLogger;
//# sourceMappingURL=server_ipc.js.map