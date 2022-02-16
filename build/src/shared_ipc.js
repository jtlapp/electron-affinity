"use strict";
/**
 * Code used by both main and renderer processes.
 */
exports.__esModule = true;
exports.retryUntilTimeout = exports.toIpcName = exports.getPropertyNames = exports.exposeApi = exports.setIpcBindingTimeout = exports.API_RESPONSE_IPC = exports.API_REQUEST_IPC = void 0;
// TODO: prefix IPC names to distinguish them.
// Name of IPC requesting an API from main for binding.
exports.API_REQUEST_IPC = "__api_request";
// Name of IPC providing information need to bind to an API.
exports.API_RESPONSE_IPC = "__api_response";
// Period between attempts to announce or bind an API.
var _RETRY_MILLIS = 50;
// Configurable timeout attempting to announce or bind an API.
var _bindingTimeoutMillis = 4000; // TODO: set to the desired timeout
/**
 * Sets the timeout for the opposing process to expose or bind to an API.
 */
function setIpcBindingTimeout(millis) {
    _bindingTimeoutMillis = millis;
}
exports.setIpcBindingTimeout = setIpcBindingTimeout;
function exposeApi(apiMap, api, installHandler) {
    var apiClassName = api.constructor.name;
    if (apiMap[apiClassName]) {
        return; // was previously exposed
    }
    var methodNames = [];
    for (var _i = 0, _a = getPropertyNames(api); _i < _a.length; _i++) {
        var methodName = _a[_i];
        if (methodName != "constructor" && !["_", "#"].includes(methodName[0])) {
            var method = api[methodName];
            if (typeof method == "function") {
                installHandler(toIpcName(apiClassName, methodName), method);
                methodNames.push(methodName);
            }
        }
    }
    apiMap[apiClassName] = methodNames;
}
exports.exposeApi = exposeApi;
// Returns all properties of the class not defined by JavaScript.
function getPropertyNames(obj) {
    var propertyNames = [];
    while (!Object.getOwnPropertyNames(obj).includes("hasOwnProperty")) {
        propertyNames.push.apply(propertyNames, Object.getOwnPropertyNames(obj));
        obj = Object.getPrototypeOf(obj);
    }
    return propertyNames;
}
exports.getPropertyNames = getPropertyNames;
// Constructs an API-specific IPC name for a method.
function toIpcName(apiClassName, methodName) {
    return "".concat(apiClassName, ":").concat(methodName);
}
exports.toIpcName = toIpcName;
// Utility for retrying a function until success or timeout.
function retryUntilTimeout(elapsedMillis, attemptFunc, timeoutMessage) {
    if (!attemptFunc()) {
        if (elapsedMillis >= _bindingTimeoutMillis) {
            throw Error(timeoutMessage);
        }
        setTimeout(function () {
            return retryUntilTimeout(elapsedMillis + _RETRY_MILLIS, attemptFunc, timeoutMessage);
        }, _RETRY_MILLIS);
    }
}
exports.retryUntilTimeout = retryUntilTimeout;
//# sourceMappingURL=shared_ipc.js.map