/**
 * Support for restoring the classes of arguments and return values.
 */
/**
 * Type of a class that can be called to restore class values. It defines
 * the static class method `restoreClass`, which takes the unstructured
 * object received via IPC and returns an instance of class C. Use for
 * creating generic restorer functions, as explained in the documentation.
 *
 * @param <C> The class that conforms to this type.
 */
export declare type RestorableClass<C> = {
    restoreClass(obj: Record<string, any>): C;
};
/**
 * Type for a function that restores the classes of arguments and return
 * values. This function is optionally the last parameter passed when
 * exposing a main API, binding to a main API, or exposing a window API.
 * The function need not restore the class of a provided object, in which
 * case it returns the provided object.
 *
 * @param className The name of the class at the time its instance was
 *    transferred via IPC
 * @param obj The unstructured object to which the class instance was
 *    converted for transmission via IPC
 * @return Either the provided object `obj` if it was not converted into
 *    a class instance, or an instance of class `className` sourced from
 *    the data in `obj`
 */
export declare type RestorerFunction = (className: string, obj: Record<string, any>) => any;
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
    function restoreValue(obj: any, info?: RestorationInfo, restorer?: RestorerFunction): any;
    function restoreThrownValue(value: any, info: RestorationInfo, restorer?: RestorerFunction): Error;
    class __ThrownNonObject {
        _affinity_rethrow: boolean;
        thrownValue: any;
        constructor(thrownValue: any);
    }
}
export {};
