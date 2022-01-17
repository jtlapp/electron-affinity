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
 * class, or leave it unchanged if the class name is not recognized.
 */
export declare type RestorerFunction = (className: string, obj: Record<string, any>) => any;
export declare namespace Restorer {
    function makeRestorable(obj: any): any;
    function makeReturnedError(error: Error): object;
    function wasThrownError(error: any): boolean;
    function restoreValue(obj: any, restorer?: RestorerFunction): any;
    function restoreThrownError(error: any, restorer?: RestorerFunction): Error;
}
