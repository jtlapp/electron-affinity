/**
 * Support for restoring the classes of arguments and return values.
 */

/**
 * Type of a class that can be called to restore class values. It defines
 * the static class method `restoreClass`, which takes the unstructured
 * object received via IPC and returns an instance of class C.
 */
export type RestorableClass<C> = {
  // static method of the class returning an instance of the class
  restoreClass(obj: Record<string, any>): C;
};

/**
 * Type for a function that restores argument and return value classes.
 * It receives the name of the class at the time it was sent via IPC
 * and the unstructured object that the class instances was converted
 * into for transmission via IPC. It returns the value in the appropriate
 * class, or leave it unchanged if the class name is not recognized.
 */
export type RestorerFunction = (
  className: string,
  obj: Record<string, any>
) => any;

export namespace Restorer {
  // Wraps thrown non-object values for relay to client. Prefixed with
  // underscores to prevent name conflict with application classes.
  export class __ThrownNonObject {
    __eipc_thrown = true;
    thrownValue: any;

    constructor(thrownValue: any) {
      this.thrownValue = thrownValue;
    }
  }

  // Makes an object restorable to its class by marking it with its class.
  export function makeRestorable(obj: any): any {
    if (typeof obj == "object") {
      obj.__eipc_class = (obj as object).constructor.name;
    }
    return obj;
  }

  // Makes an error returnable to the caller for restoration.
  export function makeReturnedError(error: any): object {
    // Electron will throw an instance of Error either thrown from
    // here or returned from here, but that instance will only carry
    // the message property and no other properties. In order to
    // retain the error properties, I have to return an object that
    // is not an instance of error. However, I'm intentionally not
    // preserving the stack trace for use by the client.
    if (typeof error !== "object") {
      return makeRestorable(new __ThrownNonObject(error));
    }
    const returnedError = Object.assign(
      {
        __eipc_thrown: true,
      },
      error instanceof Error
        ? {
            __eipc_error: true,
            message: error.message,
          }
        : {},
      makeRestorable(error)
    );
    delete returnedError.stack;
    return returnedError;
  }

  // Determines whether a returned value is actually a thrown error.
  export function wasThrownError(error: any): boolean {
    return error != undefined && error.__eipc_thrown;
  }

  // Restores the class of an argument or return value when possible.
  export function restoreValue(obj: any, restorer?: RestorerFunction): any {
    if (obj !== undefined && obj.__eipc_class) {
      const className = obj.__eipc_class;
      delete obj.__eipc_class;
      if (className == "__ThrownNonObject") {
        obj = new __ThrownNonObject(obj.thrownValue);
      } else if (restorer !== undefined) {
        obj = restorer(className, obj);
      }
    }
    return obj;
  }

  // Restores an error returned via IPC.
  export function restoreThrownError(
    error: any,
    restorer?: RestorerFunction
  ): Error {
    delete error.__eipc_thrown;
    error = restoreValue(error, restorer);

    // If a non-object value was thrown
    if (error instanceof __ThrownNonObject) {
      return error.thrownValue;
    }

    // If restorer didn't restore the original Error class
    if (!(error instanceof Error) && error.__eipc_error) {
      delete error.__eipc_error;
      const message = error.message;
      delete error.message;
      error = Object.assign(new Error(message), error);
    }

    // Replace any newly generated stack.
    if (error instanceof Error) {
      error.stack = `${error.constructor.name}: ${error.message}\n\tin main process`;
    }
    return error;
  }
}
