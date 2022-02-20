/**
 * Support for restoring the classes of arguments and return values.
 */
/**
 * Type of a class that can be called to restore class values. It defines
 * the static class method `restoreClass`, which takes the unstructured
 * object received via IPC and returns an instance of class C.
 */
export declare type RestorableClass<C> = {
  restoreClass(obj: Record<string, any>): C;
};
/**
 * Type for a function that restores argument and return value classes.
 * It receives the name of the class at the time it was sent via IPC
 * and the unstructured object that the class instances was converted
 * into for transmission via IPC. It returns the value in the appropriate
 * class, or leaves it unchanged if the class name is not recognized.
 */
export declare type RestorerFunction = (
  className: string,
  obj: Record<string, any>
) => any;
interface RestorationInfo {
  argIndex?: number;
  className: string;
  isError: boolean;
}
export declare namespace Restorer {
  function makeArgsRestorable(args: any[]): void;
  function makeRestorationInfo(obj: any): RestorationInfo | null;
  function makeRethrownReturnValue(thrown: any): object;
  function wasThrownValue(value: any): boolean;
  function restoreArgs(args: any[], restorer?: RestorerFunction): void;
  function restoreValue(
    obj: any,
    info?: RestorationInfo,
    restorer?: RestorerFunction
  ): any;
  function restoreThrownValue(
    value: any,
    info: RestorationInfo,
    restorer?: RestorerFunction
  ): Error;
  class __ThrownNonObject {
    _affinity_rethrow: boolean;
    thrownValue: any;
    constructor(thrownValue: any);
  }
}
export {};
