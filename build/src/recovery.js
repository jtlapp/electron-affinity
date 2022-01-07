"use strict";
exports.__esModule = true;
exports.Recovery = void 0;
var Recovery;
(function (Recovery) {
    function prepareArgument(arg) {
        if (typeof arg == "object") {
            arg.__eipc_class = arg.constructor.name;
        }
        return arg;
    }
    Recovery.prepareArgument = prepareArgument;
    function prepareThrownError(error) {
        // Electron will throw an instance of Error either thrown from
        // here or returned from here, but that instance will only carry
        // the message property and no other properties. In order to
        // retain the error properties, I have to return an object that
        // is not an instance of error. However, I'm intentionally not
        // preserving the stack trace for use by the client.
        return Object.assign({
            __eipc_thrown: true,
            message: error.message
        }, prepareArgument(error));
    }
    Recovery.prepareThrownError = prepareThrownError;
    function wasThrownError(error) {
        return error != undefined && error.__eipc_thrown !== undefined;
    }
    Recovery.wasThrownError = wasThrownError;
    function recoverArgument(arg, recoveryFunc) {
        if (arg !== undefined && arg.__eipc_class !== undefined) {
            var className = arg.__eipc_class;
            delete arg.__eipc_class;
            if (recoveryFunc !== undefined) {
                arg = recoveryFunc(className, arg);
            }
        }
        return arg;
    }
    Recovery.recoverArgument = recoverArgument;
    function recoverThrownError(error, recoveryFunc) {
        delete error.__eipc_thrown;
        error = recoverArgument(error, recoveryFunc);
        if (!(error instanceof Error)) {
            var message = error.message;
            delete error.message;
            error = Object.assign(new Error(message), error);
        }
        // Drop stack trace for main process.
        error.stack = error.constructor.name + ": " + error.message + "\n\tin main process";
        return error;
    }
    Recovery.recoverThrownError = recoverThrownError;
})(Recovery = exports.Recovery || (exports.Recovery = {}));
//# sourceMappingURL=recovery.js.map