"use strict";
exports.__esModule = true;
exports.Restorer = void 0;
var Restorer;
(function (Restorer) {
    function prepareArgument(arg) {
        if (typeof arg == "object") {
            arg.__eipc_class = arg.constructor.name;
        }
        return arg;
    }
    Restorer.prepareArgument = prepareArgument;
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
    Restorer.prepareThrownError = prepareThrownError;
    function wasThrownError(error) {
        return error != undefined && error.__eipc_thrown !== undefined;
    }
    Restorer.wasThrownError = wasThrownError;
    function restoreArgument(arg, restorer) {
        if (arg !== undefined && arg.__eipc_class !== undefined) {
            var className = arg.__eipc_class;
            delete arg.__eipc_class;
            if (restorer !== undefined) {
                arg = restorer(className, arg);
            }
        }
        return arg;
    }
    Restorer.restoreArgument = restoreArgument;
    function restoreThrownError(error, restorer) {
        delete error.__eipc_thrown;
        error = restoreArgument(error, restorer);
        if (!(error instanceof Error)) {
            var message = error.message;
            delete error.message;
            error = Object.assign(new Error(message), error);
        }
        // Drop stack trace for main process.
        error.stack = error.constructor.name + ": " + error.message + "\n\tin main process";
        return error;
    }
    Restorer.restoreThrownError = restoreThrownError;
})(Restorer = exports.Restorer || (exports.Restorer = {}));
//# sourceMappingURL=restorer.js.map