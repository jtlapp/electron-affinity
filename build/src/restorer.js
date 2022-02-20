"use strict";
/**
 * Support for restoring the classes of arguments and return values.
 */
exports.__esModule = true;
exports.Restorer = void 0;
var Restorer;
(function (Restorer) {
    // Makes all the arguments of an argument list restorable.
    function makeArgsRestorable(args) {
        var infos = [];
        if (args !== undefined) {
            for (var i = 0; i < args.length; ++i) {
                var info = Restorer.makeRestorationInfo(args[i]);
                if (info) {
                    info.argIndex = i;
                    infos.push(info);
                }
            }
        }
        // Passed argument list always ends with restoration information.
        args.push(infos);
    }
    Restorer.makeArgsRestorable = makeArgsRestorable;
    // Returns information needed to restore an object to its original class.
    function makeRestorationInfo(obj) {
        if (obj === null || typeof obj != "object") {
            return null;
        }
        return {
            className: obj.constructor.name,
            isError: obj instanceof Error
        };
    }
    Restorer.makeRestorationInfo = makeRestorationInfo;
    // Makes an error returnable to the caller for restoration and
    // re-throwing, returning the value that the API must return.
    // The thrown value need not be an instance of error.
    function makeRethrownReturnValue(thrown) {
        // Electron will throw an instance of Error either thrown from
        // here or returned from here, but that instance will only carry
        // the message property and no other properties. In order to
        // retain the error properties, I have to return an object that
        // is not an instance of error. However, I'm intentionally not
        // preserving the stack trace, hiding it from the client.
        if (typeof thrown !== "object") {
            thrown = new __ThrownNonObject(thrown);
            return [thrown, Restorer.makeRestorationInfo(thrown)];
        }
        var info = Restorer.makeRestorationInfo(thrown);
        var returnedError = Object.assign({ __affinity_rethrow: true }, thrown instanceof Error ? { message: thrown.message } : {}, thrown);
        delete returnedError.stack;
        return [returnedError, info];
    }
    Restorer.makeRethrownReturnValue = makeRethrownReturnValue;
    // Determines whether a returned value is actually a thrown value.
    function wasThrownValue(value) {
        return value != undefined && value.__affinity_rethrow;
    }
    Restorer.wasThrownValue = wasThrownValue;
    // Restores argument list using provided restorer function.
    function restoreArgs(args, restorer) {
        if (args !== undefined) {
            var infos = args.pop();
            var infoIndex = 0;
            for (var argIndex = 0; argIndex < args.length; ++argIndex) {
                args[argIndex] = Restorer.restoreValue(args[argIndex], infoIndex < infos.length && argIndex == infos[infoIndex].argIndex
                    ? infos[infoIndex++]
                    : undefined, restorer);
            }
        }
    }
    Restorer.restoreArgs = restoreArgs;
    // Restores the class of an argument or return value when possible.
    function restoreValue(obj, info, restorer) {
        if (info) {
            if (info.className == "__ThrownNonObject") {
                obj = new __ThrownNonObject(obj.thrownValue);
            }
            else if (restorer !== undefined) {
                obj = restorer(info.className, obj);
            }
        }
        return obj;
    }
    Restorer.restoreValue = restoreValue;
    // Restores a value that was thrown for re-throwing after being returned.
    function restoreThrownValue(value, info, restorer) {
        delete value.__affinity_rethrow;
        value = restoreValue(value, info, restorer);
        // If a non-object value was thrown
        if (value instanceof __ThrownNonObject) {
            return value.thrownValue;
        }
        // If restorer didn't restore the original Error class
        if (!(value instanceof Error) && info.isError) {
            var message = value.message;
            delete value.message;
            value = Object.assign(new Error(message), value);
        }
        // Replace any newly generated stack.
        if (value instanceof Error) {
            value.stack = value.constructor.name + ": " + value.message + "\n\tin main process";
        }
        return value;
    }
    Restorer.restoreThrownValue = restoreThrownValue;
    // Wraps thrown non-object values for relay to client. Prefixed with
    // underscores to prevent name conflict with application classes.
    var __ThrownNonObject = /** @class */ (function () {
        function __ThrownNonObject(thrownValue) {
            this.__affinity_rethrow = true;
            this.thrownValue = thrownValue;
        }
        return __ThrownNonObject;
    }());
    Restorer.__ThrownNonObject = __ThrownNonObject;
})(Restorer = exports.Restorer || (exports.Restorer = {}));
//# sourceMappingURL=restorer.js.map