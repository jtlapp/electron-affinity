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
 * class, or leaves it unchanged if the class name is not recognized.
 */
export type RestorerFunction = (
  className: string,
  obj: Record<string, any>
) => any;

// TODO: test sending errors as arguments
// TODO: test throwing non-Error objects
// TODO: test without restorer
// TODO: test with different restorers

// Structure describing how to restore an object IPC argument or return value.
interface RestorationInfo {
  argIndex?: number; // if not return value, index of argument in args list
  className: string; // name of the object's class
  isError: boolean; // whether the object subclasses Error
}

export namespace Restorer {
  // Makes all the arguments of an argument list restorable.
  export function makeArgsRestorable(args: any[]): void {
    const infos: RestorationInfo[] = [];
    if (args !== undefined) {
      for (let i = 0; i < args.length; ++i) {
        const info = Restorer.makeRestorationInfo(args[i]);
        if (info) {
          info.argIndex = i;
          infos.push(info);
        }
      }
    }
    // Passed argument list always ends with restoration information.
    args.push(infos);
  }

  // Returns information needed to restore an object to its original class.
  export function makeRestorationInfo(obj: any): RestorationInfo | null {
    if (obj === null || typeof obj != "object") {
      return null;
    }
    return {
      className: obj.constructor.name,
      isError: obj instanceof Error,
    };
  }

  // Makes an error returnable to the caller for restoration and
  // re-throwing, returning the value that the API must return.
  // The thrown value need not be an instance of error.
  export function makeRethrownReturnValue(thrown: any): object {
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
    const info = Restorer.makeRestorationInfo(thrown);
    const returnedError = Object.assign(
      { __affinity_rethrow: true },
      thrown instanceof Error ? { message: thrown.message } : {},
      thrown
    );
    delete returnedError.stack;
    return [returnedError, info];
  }

  // Determines whether a returned value is actually a thrown value.
  export function wasThrownValue(value: any): boolean {
    return value != undefined && value.__affinity_rethrow;
  }

  // Restores argument list using provided restorer function.
  export function restoreArgs(args: any[], restorer?: RestorerFunction) {
    if (args !== undefined) {
      const infos: RestorationInfo[] = args.pop();
      let infoIndex = 0;
      for (let argIndex = 0; argIndex < args.length; ++argIndex) {
        args[argIndex] = Restorer.restoreValue(
          args[argIndex],
          infoIndex < infos.length && argIndex == infos[infoIndex].argIndex
            ? infos[infoIndex++]
            : undefined,
          restorer
        );
      }
    }
  }

  // Restores the class of an argument or return value when possible.
  export function restoreValue(
    obj: any,
    info?: RestorationInfo,
    restorer?: RestorerFunction
  ): any {
    if (info) {
      if (info.className == "__ThrownNonObject") {
        obj = new __ThrownNonObject(obj.thrownValue);
      } else if (restorer !== undefined) {
        obj = restorer(info.className, obj);
      }
    }
    return obj;
  }

  // Restores a value that was thrown for re-throwing after being returned.
  export function restoreThrownValue(
    value: any,
    info: RestorationInfo,
    restorer?: RestorerFunction
  ): Error {
    delete value.__affinity_rethrow;
    value = restoreValue(value, info, restorer);

    // If a non-object value was thrown
    if (value instanceof __ThrownNonObject) {
      return value.thrownValue;
    }

    // If restorer didn't restore the original Error class
    if (!(value instanceof Error) && info.isError) {
      const message = value.message;
      delete value.message;
      value = Object.assign(new Error(message), value);
    }

    // Replace any newly generated stack.
    if (value instanceof Error) {
      value.stack = `${value.constructor.name}: ${value.message}\n\tin main process`;
    }
    return value;
  }

  // Wraps thrown non-object values for relay to client. Prefixed with
  // underscores to prevent name conflict with application classes.
  export class __ThrownNonObject {
    __affinity_rethrow = true;
    thrownValue: any;

    constructor(thrownValue: any) {
      this.thrownValue = thrownValue;
    }
  }
}
