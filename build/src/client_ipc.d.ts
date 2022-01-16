/**
 * Code specific to handling IPC in the renderer process.
 */
import { PublicProperty } from "./shared_ipc";
import { Recovery } from "./recovery";
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
 * @param recoveryFunc Optional TBD
 */
export declare function bindMainApi<T>(apiClassName: string, recoveryFunc?: Recovery.RecoveryFunction): Promise<MainApiBinding<T>>;
