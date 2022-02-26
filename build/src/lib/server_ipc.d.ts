/**
 * Code specific to handling IPC in the main process.
 */
import { BrowserWindow } from "electron";
import { PublicProperty } from "./shared_ipc";
import { RestorerFunction } from "./restorer";
/**
 * Type to which a main API of class T conforms, requiring each API to
 * return a promise. All properties of the method not beginning with an
 * underscore or a pound are considered IPC APIs. All properties beginning
 * with neither an underscore nor a pound are ignored, allowing an API
 * class to have internal structure on which the APIs rely.
 */
export declare type ElectronMainApi<T> = {
    [K in keyof T]: K extends PublicProperty<K> ? (...args: any[]) => Promise<any> : any;
};
/**
 * Wrapper for exceptions occurring in a main API that are to be relayed
 * as errors back to the calling window. Any uncaught exception of a main API
 * not of this type is throw within Electron and not returned to the window.
 */
export declare class RelayedError {
    errorToRelay: any;
    constructor(errorToRelay: any);
}
/**
 * Exposes a main API to all windows for possible binding.
 *
 * @param <T> (inferred type, not specified in call)
 * @param mainApi The API to expose
 * @param restorer Optional function for restoring the classes of
 *    arguments passed to main. Instances of classes not restored arrive
 *    as untyped structures.
 */
export declare function exposeMainApi<T>(mainApi: ElectronMainApi<T>, restorer?: RestorerFunction): void;
/**
 * Receives errors thrown in main APIs that were not wrapped in RelayedError.
 */
export declare function setIpcErrorLogger(loggerFunc: (err: Error) => void): void;
/**
 * Type to which a bound window API of class T conforms. It only exposes the
 * methods of class T not starting with `_` or `#`, and regardless of what
 * the method returns, the API returns void.
 */
export declare type WindowApiBinding<T> = {
    [K in Extract<keyof T, PublicProperty<keyof T>>]: T[K] extends (...args: infer A) => any ? (...args: A) => void : never;
};
/**
 * Returns a main-side binding for a window API of a given class, restricting
 * the binding to the given window. Failure of the window to expose the API
 * before timeout results in an error. There is a default timeout, but you
 * can override it with `setIpcBindingTimeout()`.
 *
 * @param <T> Class to which to bind.
 * @param apiClassName Name of the class being bound. Must be identical to
 *    the name of class T. Provides runtime information that <T> does not.
 * @returns An API of type T that can be called as if T were local.
 */
export declare function bindWindowApi<T>(window: BrowserWindow, apiClassName: string): Promise<WindowApiBinding<T>>;
