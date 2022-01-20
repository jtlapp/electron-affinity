"use strict";
/**
 * Support for restoring the classes of arguments and return values.
 */
exports.__esModule = true;
exports.Restorer = void 0;
var Restorer;
(function (Restorer) {
    // Wraps thrown non-object values for relay to client. Prefixed with
    // underscores to prevent name conflict with application classes.
    var __ThrownNonObject = /** @class */ (function () {
        function __ThrownNonObject(thrownValue) {
            this.__eipc_thrown = true;
            this.thrownValue = thrownValue;
        }
        return __ThrownNonObject;
    }());
    Restorer.__ThrownNonObject = __ThrownNonObject;
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
        if (typeof error !== "object") {
            return makeRestorable(new __ThrownNonObject(error));
        }
        var returnedError = Object.assign({
            __eipc_thrown: true
        }, error instanceof Error
            ? {
                __eipc_error: true,
                message: error.message
            }
            : {}, makeRestorable(error));
        delete returnedError.stack;
        return returnedError;
    }
    Restorer.makeReturnedError = makeReturnedError;
    // Determines whether a returned value is actually a thrown error.
    function wasThrownError(error) {
        return error != undefined && error.__eipc_thrown;
    }
    Restorer.wasThrownError = wasThrownError;
    // Restores the class of an argument or return value when possible.
    function restoreValue(obj, restorer) {
        if (obj !== undefined && obj.__eipc_class) {
            var className = obj.__eipc_class;
            delete obj.__eipc_class;
            if (className == "__ThrownNonObject") {
                obj = new __ThrownNonObject(obj.thrownValue);
            }
            else if (restorer !== undefined) {
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
        // If a non-object value was thrown
        if (error instanceof __ThrownNonObject) {
            return error.thrownValue;
        }
        // If restorer didn't restore the original Error class
        if (!(error instanceof Error) && error.__eipc_error) {
            delete error.__eipc_error;
            var message = error.message;
            delete error.message;
            error = Object.assign(new Error(message), error);
        }
        // Replace any newly generated stack.
        if (error instanceof Error) {
            error.stack = error.constructor.name + ": " + error.message + "\n\tin main process";
        }
        return error;
    }
    Restorer.restoreThrownError = restoreThrownError;
})(Restorer = exports.Restorer || (exports.Restorer = {}));
//# sourceMappingURL=restorer.js.map