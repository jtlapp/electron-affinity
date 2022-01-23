/**
 * Code specific to handling IPC in the main process.
 */
import { BrowserWindow } from "electron";
import { ApiBinding, PublicProperty } from "./shared_ipc";
import { RestorerFunction } from "./restorer";
/**
 * Type to which a main API of class T conforms, requiring each API to
 * return a promise. All properties of the method not beginning with an
 * underscore are considered IPC APIs. All properties beginning with an
 * underscore are ignored, allowing an API class to have internal
 * structure on which the APIs rely.
 */
export declare type ElectronMainApi<T> = {
    [K in keyof T]: K extends PublicProperty<K> ? (...args: any[]) => Promise<any> : any;
};
/**
 * Wrapper for exceptions occurring in a main API that are relayed to the
 * caller in the calling window. Any uncaught exception of a main API not
 * of this type is throw within Electron and not returned to the window.
 */
export declare class RelayedError {
    errorToRelay: any;
    constructor(errorToRelay: any);
}
/**
 * Exposes a main API to a particular window, which must bind to the API.
 * Failure of the window to bind before timeout results in an error.
 *
 * @param <T> (inferred type, not specified in call)
 * @param toWindow The window to which to expose the API
 * @param mainApi The API to expose to the window
 * @param restorer Optional function for restoring the classes of
 *    arguments passed to main. Instances of classes not restored arrive
 *    as untyped structures.
 */
export declare function exposeMainApi<T>(toWindow: BrowserWindow, mainApi: ElectronMainApi<T>, restorer?: RestorerFunction): void;
/**
 * Receives errors thrown in APIs not wrapped in RelayedError.
 */
export declare function setIpcErrorLogger(loggerFunc: (err: Error) => void): void;
/**
 * Returns a main-side binding for a window API of a given class, restricting
 * the binding to the given window. Failure of the window to expose the API
 * before timeout results in an error.
 *
 * @param <T> Class to which to bind.
 * @param apiClassName Name of the class being bound. Must be identical to
 *    the name of class T. Provides runtime information that <T> does not.
 * @returns An API of type T that can be called as if T were local.
 */
export declare function bindWindowApi<T>(window: BrowserWindow, apiClassName: string): Promise<ApiBinding<T>>;
