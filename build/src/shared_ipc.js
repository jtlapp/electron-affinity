"use strict";
/**
 * Code used by both main and renderer processes.
 */
exports.__esModule = true;
exports.retryUntilTimeout = exports.toIpcName = exports.getPropertyNames = exports.setIpcBindingTimeout = exports.BOUND_API_IPC = exports.EXPOSE_API_IPC = exports.API_INFO_IPC = exports.REQUEST_API_IPC = void 0;
// TODO: prefix IPC names to distinguish them.
// Name of IPC requesting an API from main for binding.
exports.REQUEST_API_IPC = "request_api";
// Name of IPC providing information need to bind to an API.
exports.API_INFO_IPC = "api_info";
// Name of IPC announcing the availability of an API.
// TODO: delete this when I can
exports.EXPOSE_API_IPC = "expose_api";
// Name of IPC announcing that an API was bound.
// TODO: delete this when I can; only used for timeouts and ACL
exports.BOUND_API_IPC = "bound_api";
// Period between attempts to announce or bind an API.
var _RETRY_MILLIS = 50;
// Configurable timeout attempting to announce or bind an API.
var _bindingTimeoutMillis = 5000; // TODO: set to the desired timeout
/**
 * Sets the timeout for the opposing process to expose or bind to an API.
 */
function setIpcBindingTimeout(millis) {
    _bindingTimeoutMillis = millis;
}
exports.setIpcBindingTimeout = setIpcBindingTimeout;
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