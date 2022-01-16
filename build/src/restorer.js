"use strict";
/**
 * Support for restoring the classes of arguments and return values.
 */
exports.__esModule = true;
exports.Restorer = void 0;
var Restorer;
(function (Restorer) {
    // Makes an object restorable to its class by marking it with its class.
    function makeRestorable(obj) {
        if (typeof obj == "object") {
            obj.__eipc_class = obj.constructor.name;
        }
        return obj;
    }
    Restorer.makeRestorable = makeRestorable;
    // Makes an error returnable to the caller for restoration.
    function makeReturnedError(error) {
        // Electron will throw an instance of Error either thrown from
        // here or returned from here, but that instance will only carry
        // the message property and no other properties. In order to
        // retain the error properties, I have to return an object that
        // is not an instance of error. However, I'm intentionally not
        // preserving the stack trace for use by the client.
        return Object.assign({
            __eipc_thrown: true,
            message: error.message
        }, makeRestorable(error));
    }
    Restorer.makeReturnedError = makeReturnedError;
    // Determines whether a returned value is actually a thrown error.
    function wasThrownError(error) {
        return error != undefined && error.__eipc_thrown !== undefined;
    }
    Restorer.wasThrownError = wasThrownError;
    // Restores the class of an argument or return value when possible.
    function restoreValue(obj, restorer) {
        if (obj !== undefined && obj.__eipc_class !== undefined) {
            var className = obj.__eipc_class;
            delete obj.__eipc_class;
            if (restorer !== undefined) {
                obj = restorer(className, obj);
            }
        }
        return obj;
    }
    Restorer.restoreValue = restoreValue;
    // Restores an error returned via IPC.
    function restoreThrownError(error, restorer) {
        delete error.__eipc_thrown;
        error = restoreValue(error, restorer);
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