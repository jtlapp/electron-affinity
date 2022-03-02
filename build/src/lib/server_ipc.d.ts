/**
 * Code specific to handling IPC in the main process.
 */
import { BrowserWindow } from "electron";
import { PublicProperty } from "./shared_ipc";
import { RestorerFunction } from "./restorer";
/**
 * Type to which a main API class must conform. It requres each API method
 * to return a promise. All properties of the method not beginning with `_`
 * or `#` will be exposed as API methods. All properties beginning with `_` or
 * `#` are ignored, which allows the API class to have internal structure on
 * which the APIs rely. Use `checkMainApi` or `checkMainApiClass` to type-
 * check main API classes.
 *
 * @param <T> The type of the API class itself, typically inferred from a
 *    function that accepts an argument of type `ElectronMainApi`.
 * @see checkMainApi
 * @see checkMainApiClass
 */
export declare type ElectronMainApi<T> = {
    [K in keyof T]: K extends PublicProperty<K> ? (...args: any[]) => Promise<any> : any;
};
/**
 * Type checks the argument to ensure it conforms to the expectaions of a
 * main API (which is an instance of the API class). All properties not
 * beginning with `_` or `#` must be methods returning promises and will be
 * interpreted as API methods. Returns the argument to allow type-checking
 * of APIs in their exact place of use.
 *
 * @param <T> (inferred type, not specified in call)
 * @param api Instance of the main API class to type check
 * @return The provided main API
 * @see checkMainApiClass
 */
export declare function checkMainApi<T extends ElectronMainApi<T>>(api: T): T;
/**
 * Type checks the argument to ensure it conforms to the expectations of a
 * main API class. All properties not beginning with `_` or `#` must be
 * methods returning promises and will be interpreted as API methods. Useful
 * for getting type-checking in the same file as the one having the API class.
 * (Does not return the class, because the returned class would not be
 * available for `import type`.)
 *
 * @param <T> (inferred type, not specified in call)
 * @param _class The main API class to type check
 * @see checkMainApi
 */
export declare function checkMainApiClass<T extends ElectronMainApi<T>>(_class: {
    new (...args: any[]): T;
}): void;
/**
 * Class that wraps exceptions occurring in a main API that are to be
 * relayed as errors back to the calling window. A main API wishing to
 * have an exception thrown in the calling window wraps the error object
 * in an instance of this class and throws the instance. The main process
 * will ignore the throw except for transferring it to the calling window.
 * Exceptions thrown within a main API not wrapped in `RelayedError` are
 * thrown within the main process as "uncaught" exceptions.
 *
 * @param errorToRelay The error to throw within the calling window,
 *    occurring within the window's call to the main API
 */
export declare class RelayedError {
    errorToRelay: any;
    constructor(errorToRelay: any);
}
/**
 * Exposes a main API to all windows for possible binding.
 *
 * @param <T> (inferred type, not specified in call)
 * @param mainApi The API to expose to all windows, which must be an
 *    instance of a class conforming to type `ElectronMainApi`
 * @param restorer Optional function for restoring the classes of
 *    arguments passed to APIs from the window. Arguments not
 *    restored to original classes arrive as untyped objects.
 */
export declare function exposeMainApi<T>(mainApi: ElectronMainApi<T>, restorer?: RestorerFunction): void;
export declare function setIpcErrorLogger(loggerFunc: (err: any) => void): void;
/**
 * Type to which a bound window API conforms within the main process, as
 * determined from the provided window API class. This type only exposes the
 * methods of the class not starting with `_` or `#`, and regardless of what
 * the method returns, the API returns void.
 *
 * @param <T> Type of the window API class
 */
export declare type WindowApiBinding<T> = {
    [K in Extract<keyof T, PublicProperty<keyof T>>]: T[K] extends (...args: infer A) => any ? (...args: A) => void : never;
};
/**
 * Returns a main-side binding for a window API of a given class, restricting
 * the binding to the given window. Failure of the window to expose the API
 * before timeout results in an exception. There is a default timeout, but
 * you can override it with `setIpcBindingTimeout()`. (The function takes no
 * restorer parameter because window APIs do not return values.)
 *
 * @param <T> Type of the window API class to bind
 * @param window Window to which to bind the window API
 * @param apiClassName Name of the class being bound. Must be identical to
 *    the name of class T. Provides runtime information that <T> does not.
 * @returns An API of type T that can be called as if T were local to the
 *    main process.
 * @see setIpcBindingTimeout
 */
export declare function bindWindowApi<T>(window: BrowserWindow, apiClassName: string): Promise<WindowApiBinding<T>>;
