/**
 * Code specific to handling IPC in the main process.
 */
import { BrowserWindow } from "electron";
import { PublicProperty } from "./shared_ipc";
import { RestorerFunction } from "./index";
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
 * Wrapper for exceptions occurring in a main API that are to pass through to
 * the caller in the calling window. Any uncaught exception of a main API not
 * of this type is throw within Electron and not returned to the window.
 */
export declare class PassThroughError {
    errorToPass: Error;
    constructor(errorToPass: Error);
}
/**
 * Exposes a main API to a particular window, which must bind to the API.
 * Failure of the window to bind before timeout results in an error.
 *
 * @param <T> (inferred type, not specified in call)
 * @param toWindow The window to which to expose the API
 * @param mainApi The API to expose to the window
 * @param restorer Optional function for restoring the classes of
 *    arguments passed from the window. Instances of classes passed as
 *    arguments but not restored arrive as untyped structures.
 */
export declare function exposeMainApi<T>(toWindow: BrowserWindow, mainApi: ElectronMainApi<T>, restorer?: RestorerFunction): void;
/**
 * Receives errors thrown in APIs not wrapped in PassThroughError.
 */
export declare function setIpcErrorLogger(loggerFunc: (err: Error) => void): void;
