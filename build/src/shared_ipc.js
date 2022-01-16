"use strict";
/**
 * Code used by both main and renderer processes.
 */
exports.__esModule = true;
exports.retryUntilTimeout = exports.toIpcName = exports.setIpcBindingTimeout = exports.BOUND_API_EVENT = exports.EXPOSE_API_EVENT = void 0;
// Name of IPC announcing the availability of an API.
exports.EXPOSE_API_EVENT = "expose_class_api";
// Name of IPC announcing that an API was bound.
exports.BOUND_API_EVENT = "bound_class_api";
// Period between attempts to announce or bind an API.
var _RETRY_MILLIS = 50;
// Configurable timeout attempting to announce or bind an API.
var _bindingTimeoutMillis = 500;
/**
 * Sets the timeout for the opposing process to expose or bind to an API.
 */
function setIpcBindingTimeout(millis) {
    _bindingTimeoutMillis = millis;
}
exports.setIpcBindingTimeout = setIpcBindingTimeout;
// Constructs an API-specific IPC name for a method.
function toIpcName(apiClassName, methodName) {
    return apiClassName + ":" + methodName;
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