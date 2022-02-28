/**
 * Code specific to handling IPC in the renderer process.
 */
import { PublicProperty } from "./shared_ipc";
import { RestorerFunction } from "./restorer";
/**
 * Type to which a bound main API conforms within a window, as determined by
 * the provided main API class. The type only exposes the methods of the
 * class not starting with `_` or `#`, and it returns the exact
 * return types of the individual methods, which are necessarily promises.
 *
 * @param <T> Type of the main API class
 */
export declare type MainApiBinding<T> = {
    [K in Extract<keyof T, PublicProperty<keyof T>>]: T[K];
};
declare global {
    interface Window {
        __ipc: {
            invoke: (channel: string, data?: any) => Promise<any>;
            send: (channel: string, data: any) => void;
            on: (channel: string, func: (data: any) => void) => void;
        };
    }
}
/**
 * Returns a window-side binding for a main API of a given class. Main must
 * have previously exposed the API. Failure of the main process to expose the
 * API before timeout results in an exception. There is a default timeout, but
 * you can override it with `setIpcBindingTimeout()`.
 *
 * @param <T> Type of the main API class to bind
 * @param apiClassName Name of the class being bound. Must be identical to
 *    the name of class T. Provides runtime information that <T> does not.
 * @param restorer Optional function for restoring the classes of API return
 *    values. Return values not restored arrive as untyped objects.
 * @returns An API of type T that can be called as if T were local to
 *    the window.
 */
export declare function bindMainApi<T>(apiClassName: string, restorer?: RestorerFunction): Promise<MainApiBinding<T>>;
/**
 * Type to which a window API class must conform. It requires that all
 * properties of the class not beginning with `_` or `#` be functions, which
 * will be exposed as API methods. All properties beginning with `_` or `#`
 * are ignored, which allows the API class to have internal structure on
 * which the APIs rely. Use `checkWindowApi` to type-check window API classes.
 *
 * @param <T> The type of the API class itself, typically inferred from a
 *    function that accepts an argument of type `ElectronWindowApi`.
 * @see checkWindowApi
 */
export declare type ElectronWindowApi<T> = {
    [K in keyof T]: K extends PublicProperty<K> ? (...args: any[]) => void : any;
};
/**
 * Type checks the argument to ensure it conforms with `ElectronWindowApi`,
 * and returns the argument for the convenience of the caller.
 *
 * @param <T> (inferred type, not specified in call)
 * @param api Instance of the window API class to type check
 * @return The provided window API
 * @see ElectronWindowApi
 */
export declare function checkWindowApi<T extends ElectronWindowApi<T>>(api: T): T;
/**
 * Exposes a window API to the main process for possible binding.
 *
 * @param <T> (inferred type, not specified in call)
 * @param windowApi The API to expose to the main process, which must be
 *    an instance of a class conforming to type `ElectronWindowApi`
 * @param restorer Optional function for restoring the classes of
 *    arguments passed to APIs from the main process. Arguments not
 *    restored to original classes arrive as untyped objects.
 */
export declare function exposeWindowApi<T>(windowApi: ElectronWindowApi<T>, restorer?: RestorerFunction): void;
