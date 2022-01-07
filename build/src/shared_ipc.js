"use strict";
exports.__esModule = true;
exports.retryUntilTimeout = exports.setIpcBindingTimeout = exports.toIpcName = exports.BOUND_API_EVENT = exports.EXPOSE_API_EVENT = void 0;
exports.EXPOSE_API_EVENT = "expose_class_api";
exports.BOUND_API_EVENT = "bound_class_api";
var _RETRY_MILLIS = 50;
var _bindingTimeoutMillis = 500;
function toIpcName(apiClassName, methodName) {
    return apiClassName + ":" + methodName;
}
exports.toIpcName = toIpcName;
function setIpcBindingTimeout(millis) {
    _bindingTimeoutMillis = millis;
}
exports.setIpcBindingTimeout = setIpcBindingTimeout;
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