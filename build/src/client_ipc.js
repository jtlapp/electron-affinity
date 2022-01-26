"use strict";
/**
 * Code specific to handling IPC in the renderer process.
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
exports.exposeWindowApi = exports.bindMainApi = void 0;
// TODO: Auto install APIs on the window object, in addition to returning it,
// to give the app flexibility.
// TODO: Change _ipc to __ipc.
// TODO: After I've finished the test suite, look at combining main/window logic.
var shared_ipc_1 = require("./shared_ipc");
var restorer_1 = require("./restorer");
// Structure mapping API names to the methods they contain.
var _mainApiMap = {};
// Structure tracking bound APIs.
var _boundMainApis = {};
/**
 * Returns a window-side binding for a main API of a given class.
 * Failure of main to expose the API before timeout results in an error.
 *
 * @param <T> Class to which to bind.
 * @param apiClassName Name of the class being bound. Must be identical to
 *    the name of class T. Provides runtime information that <T> does not.
 * @param restorer Optional function for restoring the classes of returned
 *    values to the classes they had when transmitted by main. Instances of
 *    classes not restored arrive as untyped structures.
 * @returns An API of type T that can be called as if T were local.
 */
function bindMainApi(apiClassName, restorer) {
    _installIpcListeners();
    // Requests are only necessary after the window has been reloaded.
    window._ipc.send(shared_ipc_1.REQUEST_API_IPC, apiClassName);
    return new Promise(function (resolve) {
        var api = _boundMainApis[apiClassName];
        if (api !== undefined) {
            resolve(api);
        }
        else {
            (0, shared_ipc_1.retryUntilTimeout)(0, function () {
                return _attemptBindMainApi(apiClassName, restorer, resolve);
            }, 
            // TODO: make error message clearer
            "Timed out waiting to bind main API '" + apiClassName + "'");
        }
    });
}
exports.bindMainApi = bindMainApi;
// Implements a single attempt to bind to a main API.
function _attemptBindMainApi(apiClassName, restorer, resolve) {
    var _this = this;
    var methodNames = _mainApiMap[apiClassName];
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
                                    restorer_1.Restorer.makeRestorable(arg);
                                }
                            }
                            return [4 /*yield*/, window._ipc.invoke((0, shared_ipc_1.toIpcName)(apiClassName, methodName), args)];
                        case 1:
                            response = _b.sent();
                            if (restorer_1.Restorer.wasThrownError(response)) {
                                throw restorer_1.Restorer.restoreThrownError(response, restorer);
                            }
                            return [2 /*return*/, restorer_1.Restorer.restoreValue(response, restorer)];
                    }
                });
            });
        }); // typescript can't confirm the method signature
    };
    for (var _i = 0, methodNames_1 = methodNames; _i < methodNames_1.length; _i++) {
        var methodName = methodNames_1[_i];
        _loop_1(methodName);
    }
    _boundMainApis[apiClassName] = boundApi;
    resolve(boundApi);
    window._ipc.send(shared_ipc_1.BOUND_API_IPC, apiClassName);
    return true;
}
//// WINDOW API SUPPORT //////////////////////////////////////////////////////
// Structure mapping window API names to the methods each contains.
var _windowApiMap = {};
/**
 * Exposes a window API to main for possible binding.
 *
 * @param <T> (inferred type, not specified in call)
 * @param windowApi The API to expose to main
 * @param restorer Optional function for restoring the classes of
 *    arguments passed from main. Instances of classes not restored
 *    arrive as untyped structures.
 */
function exposeWindowApi(windowApi, restorer) {
    var apiClassName = windowApi.constructor.name;
    _installIpcListeners();
    if (_windowApiMap[apiClassName] === undefined) {
        var methodNames = [];
        var _loop_2 = function (methodName) {
            if (methodName != "constructor" && !["_", "#"].includes(methodName[0])) {
                var method_1 = windowApi[methodName];
                if (typeof method_1 == "function") {
                    window._ipc.on((0, shared_ipc_1.toIpcName)(apiClassName, methodName), function (args) {
                        if (args !== undefined) {
                            for (var i = 0; i < args.length; ++i) {
                                args[i] = restorer_1.Restorer.restoreValue(args[i], restorer);
                            }
                        }
                        method_1.bind(windowApi).apply(void 0, args);
                    });
                    methodNames.push(methodName);
                }
            }
        };
        for (var _i = 0, _a = (0, shared_ipc_1.getPropertyNames)(windowApi); _i < _a.length; _i++) {
            var methodName = _a[_i];
            _loop_2(methodName);
        }
        _windowApiMap[apiClassName] = methodNames;
    }
}
exports.exposeWindowApi = exposeWindowApi;
// Send an API registration to a window.
function sendApiRegistration(apiClassName) {
    var registration = {
        className: apiClassName,
        methodNames: _windowApiMap[apiClassName]
    };
    window._ipc.send(shared_ipc_1.EXPOSE_API_IPC, registration);
}
//// COMMON MAIN & WINDOW SUPPORT API ////////////////////////////////////////
var _listeningForIPC = false;
function _installIpcListeners() {
    if (!_listeningForIPC) {
        // TODO: revisit the request/expose protocol
        window._ipc.on(shared_ipc_1.REQUEST_API_IPC, function (apiClassName) {
            console.log("received API request for ", apiClassName);
            sendApiRegistration(apiClassName);
            console.log("sent registration");
        });
        window._ipc.on(shared_ipc_1.EXPOSE_API_IPC, function (api) {
            _mainApiMap[api.className] = api.methodNames;
        });
        _listeningForIPC = true;
    }
}
//# sourceMappingURL=client_ipc.js.map