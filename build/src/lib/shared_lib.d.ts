/**
 * Code used by both main and renderer processes.
 */
export declare const API_REQUEST_IPC = "_affinity_api_request";
export declare const API_RESPONSE_IPC = "_affinity_api_response";
/**
 * Utility type for providing the value to which an asynchronous function
 * resolves. That is, if a function F returns Promise<R>, then AwaitedType<T>
 * evaluates to type R. Use for extracting the types of bound APIs.
 *
 * @param <F> Function for which to determine the resolving type.
 */
export declare type AwaitedType<F> = F extends (...args: any[]) => Promise<infer R> ? R : never;
/**
 * Sets the binding timeout. This is the maximum time allowed for the main
 * process to bind to any window API and the maximum time allowed for a
 * window to bind to a main API. Also applies to any bindings in progress.
 *
 * @param millis Duration of timeout in milliseconds
 */
export declare function setIpcBindingTimeout(millis: number): void;
export declare type PublicProperty<P> = P extends `_${string}` ? never : P extends `#${string}` ? never : P;
export declare type ApiRegistration = {
    className: string;
    methodNames: string[];
};
export declare type ApiRegistrationMap = Record<string, string[]>;
declare type ElectronApi<T> = {
    [K in PublicProperty<keyof T>]: any;
};
export declare function exposeApi<T>(apiMap: ApiRegistrationMap, api: ElectronApi<T>, installHandler: (ipcName: string, method: any) => void): void;
export declare function getPropertyNames(obj: any): string[];
export declare function toIpcName(apiClassName: string, methodName: string): string;
export declare function retryUntilTimeout(elapsedMillis: number, attemptFunc: () => boolean, timeoutMessage: string): void;
export {};
