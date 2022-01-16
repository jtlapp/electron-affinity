/**
 * Code used by both main and renderer processes.
 */
export declare const EXPOSE_API_EVENT = "expose_class_api";
export declare const BOUND_API_EVENT = "bound_class_api";
/**
 * Sets the timeout for the opposing process to expose or bind to an API.
 */
export declare function setIpcBindingTimeout(millis: number): void;
export declare type PrivateProperty<P> = P extends `_${string}` ? P : P extends `#${string}` ? P : never;
export declare type PublicProperty<P> = P extends PrivateProperty<P> ? never : P extends string ? P : never;
export declare type ApiRegistration = {
    windowID: number;
    className: string;
    methodNames: string[];
};
export declare type ApiBinding = {
    windowID: number;
    className: string;
};
export declare type ApiRegistrationMap = Record<string, string[]>;
export declare function toIpcName(apiClassName: string, methodName: string): string;
export declare function retryUntilTimeout(elapsedMillis: number, attemptFunc: () => boolean, timeoutMessage: string): void;
