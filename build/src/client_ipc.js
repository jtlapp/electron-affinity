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
exports.bindMainApi = void 0;
var electron_1 = require("electron");
var shared_ipc_1 = require("./shared_ipc");
var recovery_1 = require("./recovery");
// TODO: Should I have bound API invocation timeouts?
var _registrationMap = {};
var _boundApis = {};
var _listeningForApis = false;
var _windowID;
function bindMainApi(apiClassName, recoveryFunc) {
    if (!_listeningForApis) {
        electron_1.ipcRenderer.on(shared_ipc_1.EXPOSE_API_EVENT, function (_event, api) {
            _windowID = api.windowID;
            _registrationMap[api.className] = api.methodNames;
        });
        _listeningForApis = true;
    }
    return new Promise(function (resolve) {
        var api = _boundApis[apiClassName];
        if (api !== undefined) {
            resolve(api);
        }
        else {
            // TODO: test this
            (0, shared_ipc_1.retryUntilTimeout)(0, function () {
                return _attemptBindIpcApi(apiClassName, recoveryFunc, resolve);
            }, "Timed out waiting to bind main API '" + apiClassName + "'");
        }
    });
}
exports.bindMainApi = bindMainApi;
function _attemptBindIpcApi(apiClassName, recoveryFunc, resolve) {
    var _this = this;
    var methodNames = _registrationMap[apiClassName];
    if (methodNames === undefined) {
        return false;
    }
    var boundApi = {};
    var _loop_1 = function (methodName) {
        var typedMethodName = methodName;
        boundApi[typedMethodName] = (function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return __awaiter(_this, void 0, void 0, function () {
                var _a, args_1, arg, response;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            if (args !== undefined) {
                                for (_a = 0, args_1 = args; _a < args_1.length; _a++) {
                                    arg = args_1[_a];
                                    recovery_1.Recovery.prepareArgument(arg);
                                }
                            }
                            return [4 /*yield*/, electron_1.ipcRenderer.invoke((0, shared_ipc_1.toIpcName)(apiClassName, methodName), args)];
                        case 1:
                            response = _b.sent();
                            if (recovery_1.Recovery.wasThrownError(response)) {
                                throw recovery_1.Recovery.recoverThrownError(response, recoveryFunc);
                            }
                            return [2 /*return*/, recovery_1.Recovery.recoverArgument(response, recoveryFunc)];
                    }
                });
            });
        }); // typescript can't confirm the method signature
    };
    for (var _i = 0, methodNames_1 = methodNames; _i < methodNames_1.length; _i++) {
        var methodName = methodNames_1[_i];
        _loop_1(methodName);
    }
    _boundApis[apiClassName] = boundApi;
    resolve(boundApi);
    var binding = {
        windowID: _windowID,
        className: apiClassName
    };
    electron_1.ipcRenderer.send(shared_ipc_1.BOUND_API_EVENT, binding);
    return true;
}
//# sourceMappingURL=client_ipc.js.map