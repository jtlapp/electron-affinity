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
exports.exposeWindowApi = exports.checkWindowApiClass = exports.checkWindowApi = exports.bindMainApi = void 0;
var shared_lib_1 = require("./shared_lib");
var restorer_lib_1 = require("./restorer_lib");
// Structure mapping API names to the methods they contain.
var _mainApiMap = {};
// Structure tracking bound main APIs.
var _boundMainApis = {};
/**
 * Returns a window-side binding for a main API of a given class. Main must
 * have previously exposed the API. Failure of the main process to expose the
 * API before timeout results in an exception. There is a default timeout, but
 * you can override it with `setIpcBindingTimeout()`.
 *
 * @param <T> Type of the main API class to bind
 * @param apiClassName Name of the class being bound. Must be identical to
 *    the name of class T. Provides runtime information that <T> does not.
 * @param restorer Optional function for restoring the classes of API return
 *    values. Return values not restored arrive as untyped objects.
 * @returns An API of type T that can be called as if T were local to
 *    the window.
 * @see setIpcBindingTimeout
 */
function bindMainApi(apiClassName, restorer) {
    _installIpcListeners();
    return new Promise(function (resolve) {
        if (_boundMainApis[apiClassName]) {
            resolve(_boundMainApis[apiClassName]);
        }
        else {
            // Make only one request, as main must prevously expose the API.
            window._affinity_ipc.send(shared_lib_1.API_REQUEST_IPC, apiClassName);
            // Client retries so it can bind at earliest possible time.
            (0, shared_lib_1.retryUntilTimeout)(0, function () {
                return _attemptBindMainApi(apiClassName, restorer, resolve);
            }, "Timed out waiting to bind main API '".concat(apiClassName, "'"));
        }
    });
}
exports.bindMainApi = bindMainApi;
// Implements a single attempt to bind to a main API.
function _attemptBindMainApi(apiClassName, restorer, resolve) {
    // Wait for the window API binding to arrive.
    var _this = this;
    var methodNames = _mainApiMap[apiClassName];
    if (!methodNames) {
        return false;
    }
    // Construct the main API binding.
    var boundApi = {};
    var _loop_1 = function (methodName) {
        var typedMethodName = methodName;
        boundApi[typedMethodName] = (function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return __awaiter(_this, void 0, void 0, function () {
                var response, returnValue, info;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            restorer_lib_1.Restorer.makeArgsRestorable(args);
                            return [4 /*yield*/, window._affinity_ipc.invoke((0, shared_lib_1.toIpcName)(apiClassName, methodName), args)];
                        case 1:
                            response = _a.sent();
                            returnValue = response[0];
                            info = response[1];
                            if (restorer_lib_1.Restorer.wasThrownValue(returnValue)) {
                                throw restorer_lib_1.Restorer.restoreThrownValue(returnValue, info, restorer);
                            }
                            return [2 /*return*/, restorer_lib_1.Restorer.restoreValue(returnValue, info, restorer)];
                    }
                });
            });
        }); // typescript can't confirm the method signature
    };
    for (var _i = 0, methodNames_1 = methodNames; _i < methodNames_1.length; _i++) {
        var methodName = methodNames_1[_i];
        _loop_1(methodName);
    }
    // Save the binding to return on duplicate binding requests.
    _boundMainApis[apiClassName] = boundApi;
    // Return the binding to the window.
    resolve(boundApi);
    return true;
}
//// WINDOW API SUPPORT //////////////////////////////////////////////////////
// Structure mapping window API names to the methods each contains.
var _windowApiMap = {};
/**
 * Type checks the argument to ensure it conforms to the expectations of a
 * window API (which is an instance of the API class). All properties not
 * beginning with `_` or `#` must be methods and will be interpreted as API
 * methods. Returns the argument to allow type-checking of APIs in their
 * place of use.
 *
 * @param <T> (inferred type, not specified in call)
 * @param api Instance of the window API class to type check
 * @return The provided window API instance
 * @see checkWindowApiClass
 */
function checkWindowApi(api) {
    return api;
}
exports.checkWindowApi = checkWindowApi;
/**
 * Type checks the argument to ensure it conforms to the expectations of a
 * window API class. All properties not beginning with `_` or `#` must be
 * methods and will be interpreted as API methods. Returns the argument to
 * allow type-checking of APIs in their place of use.
 *
 * @param <T> (inferred type, not specified in call)
 * @param _class The window API class to type check
 * @return The provided window API class
 * @see checkWindowApi
 */
function checkWindowApiClass(_class) {
    return _class;
}
exports.checkWindowApiClass = checkWindowApiClass;
/**
 * Exposes a window API to the main process for possible binding.
 *
 * @param <T> (inferred type, not specified in call)
 * @param windowApi The API to expose to the main process, which must be
 *    an instance of a class conforming to type `ElectronWindowApi`. Only
 *    one instance of any given class can ever be exposed.
 * @param restorer Optional function for restoring the classes of
 *    arguments passed to APIs from the main process. Arguments not
 *    restored to original classes arrive as untyped objects.
 */
function exposeWindowApi(windowApi, restorer) {
    _installIpcListeners();
    (0, shared_lib_1.exposeApi)(_windowApiMap, windowApi, function (ipcName, method) {
        window._affinity_ipc.on(ipcName, function (args) {
            restorer_lib_1.Restorer.restoreArgs(args, restorer);
            method.bind(windowApi).apply(void 0, args);
        });
    });
}
exports.exposeWindowApi = exposeWindowApi;
//// COMMON MAIN & WINDOW SUPPORT API ////////////////////////////////////////
var _listeningForIPC = false;
function _installIpcListeners() {
    if (!_listeningForIPC) {
        window._affinity_ipc.on(shared_lib_1.API_REQUEST_IPC, function (apiClassName) {
            var registration = {
                className: apiClassName,
                methodNames: _windowApiMap[apiClassName]
            };
            window._affinity_ipc.send(shared_lib_1.API_RESPONSE_IPC, registration);
        });
        window._affinity_ipc.on(shared_lib_1.API_RESPONSE_IPC, function (api) {
            _mainApiMap[api.className] = api.methodNames;
        });
        _listeningForIPC = true;
    }
}
//# sourceMappingURL=window_lib.js.map