/**
 * Code specific to handling IPC in the renderer process.
 */
import { PublicProperty } from "./shared_ipc";
import { RestorerFunction } from "./restorer";
declare global {
    interface Window {
        ipc: {
            invoke: (channel: string, data?: any) => Promise<any>;
            send: (channel: string, data: any) => void;
            on: (channel: string, func: (data: any) => void) => void;
        };
    }
}
/**
 * Type to which a bound API of class T conforms. It only exposes the
 * methods of class T not containing underscores.
 */
export declare type MainApiBinding<T> = {
    [K in Extract<keyof T, PublicProperty<keyof T>>]: T[K];
};
/**
 * Returns a window-side binding for a main API of a given class.
 * Failure of main to expose the API before timeout results in an error.
 *
 * @param <T> Class to which to bind.
 * @param apiClassName Name of the class being bound. Must be identical to
 *    the name of class T. Provides runtime information that <T> does not.
 * @param restorer Optional function for restoring the classes of returned
 *    values to the classes they had when transmitted by main. Instances of
 *    classes not restored arrive as untyped structures.
 * @returns An API of type T that can be called as if T were local.
 */
export declare function bindMainApi<T>(apiClassName: string, restorer?: RestorerFunction): Promise<MainApiBinding<T>>;
