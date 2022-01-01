export namespace Recovery {
  export type RecoverableClass<C> = {
    // static method of the class returning an instance of the class
    recover(obj: Record<string, any>): C;
  };

  export type RecoveryFunction = (
    className: string,
    arg: Record<string, any>
  ) => any;

  export function prepareArgument(arg: any): any {
    if (typeof arg == "object") {
      arg.__eipc_class = (arg as object).constructor.name;
    }
    return arg;
  }

  export function prepareThrownError(error: Error): object {
    // Electron will throw an instance of Error either thrown from
    // here or returned from here, but that instance will only carry
    // the message property and no other properties. In order to
    // retain the error properties, I have to return an object that
    // is not an instance of error. However, I'm intentionally not
    // preserving the stack trace for use by the client.
    return Object.assign(
      {
        __eipc_thrown: true,
        message: error.message,
      },
      prepareArgument(error)
    );
  }

  export function wasThrownError(error: any): boolean {
    return error != undefined && error.__eipc_thrown !== undefined;
  }

  export function recoverArgument(
    arg: any,
    recoveryFunc?: RecoveryFunction
  ): any {
    if (arg !== undefined && arg.__eipc_class !== undefined) {
      const className = arg.__eipc_class;
      delete arg.__eipc_class;
      if (recoveryFunc !== undefined) {
        arg = recoveryFunc(className, arg);
      }
    }
    return arg;
  }

  export function recoverThrownError(
    error: any,
    recoveryFunc?: RecoveryFunction
  ): Error {
    delete error.__eipc_thrown;
    error = recoverArgument(error, recoveryFunc);
    if (!(error instanceof Error)) {
      const message = error.message;
      delete error.message;
      error = Object.assign(new Error(message), error);
    }
    // Drop stack trace for main process.
    error.stack = `${error.constructor.name}: ${error.message}\n\tin main process`;
    return error;
  }
}
