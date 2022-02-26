/**
 * Code used by both main and renderer processes.
 */
export declare const API_REQUEST_IPC = "_affinity_api_request";
export declare const API_RESPONSE_IPC = "_affinity_api_response";
/**
 * Type to which a bound API of class T conforms. It only exposes the
 * methods of class T not containing underscores.
 */
export declare type ApiBinding<T> = {
    [K in Extract<keyof T, PublicProperty<keyof T>>]: T[K];
};
/**
 * Type to which an asynchronous function T resolve. Used for extracting
 * the resolved return type of a main API method.
 */
export declare type AwaitedType<T> = T extends (...args: any[]) => Promise<infer R> ? R : never;
/**
 * Sets the timeout for binding to an API.
 */
export declare function setIpcBindingTimeout(millis: number): void;
export declare type PrivateProperty<P> = P extends `_${string}` ? P : P extends `#${string}` ? P : never;
export declare type PublicProperty<P> = P extends PrivateProperty<P> ? never : P extends string ? P : never;
export declare type ApiRegistration = {
    className: string;
    methodNames: string[];
};
export declare type ApiRegistrationMap = Record<string, string[]>;
declare type ElectronApi<T> = {
    [K in keyof T]: K extends PublicProperty<K> ? (...args: any[]) => any : any;
};
export declare function exposeApi<T>(apiMap: ApiRegistrationMap, api: ElectronApi<T>, installHandler: (ipcName: string, method: any) => void): void;
export declare function getPropertyNames(obj: any): string[];
export declare function toIpcName(apiClassName: string, methodName: string): string;
export declare function retryUntilTimeout(elapsedMillis: number, attemptFunc: () => boolean, timeoutMessage: string): void;
export {};
