/**
 * Code used by both main and renderer processes.
 */

// TODO: prefix IPC names to distinguish them.

// Name of IPC requesting an API from main for binding.
export const REQUEST_API_IPC = "request_api";

// Name of IPC providing information need to bind to an API.
export const API_INFO_IPC = "api_info";

// Name of IPC announcing the availability of an API.
// TODO: delete this when I can
export const EXPOSE_API_IPC = "expose_api";

// Name of IPC announcing that an API was bound.
// TODO: delete this when I can; only used for timeouts and ACL
export const BOUND_API_IPC = "bound_api";

// Period between attempts to announce or bind an API.
const _RETRY_MILLIS = 50;

// Configurable timeout attempting to announce or bind an API.
let _bindingTimeoutMillis = 4000; // TODO: set to the desired timeout

/**
 * Type to which a bound API of class T conforms. It only exposes the
 * methods of class T not containing underscores.
 */
export type ApiBinding<T> = {
  [K in Extract<keyof T, PublicProperty<keyof T>>]: T[K];
};

/**
 * Sets the timeout for the opposing process to expose or bind to an API.
 */
export function setIpcBindingTimeout(millis: number): void {
  _bindingTimeoutMillis = millis;
}

// Matches object properties beginning with an underscore.
export type PrivateProperty<P> = P extends `_${string}`
  ? P
  : P extends `#${string}`
  ? P
  : never;

// Matches object properties not beginning with an underscore.
export type PublicProperty<P> = P extends PrivateProperty<P>
  ? never
  : P extends string
  ? P
  : never;

// Structure sent to window announcing availability of a main API.
export type ApiRegistration = {
  className: string;
  methodNames: string[];
};

// Structure associating API names with names of methods in the API.
export type ApiRegistrationMap = Record<string, string[]>;

// Returns all properties of the class not defined by JavaScript.
export function getPropertyNames(obj: any): string[] {
  const propertyNames: string[] = [];
  while (!Object.getOwnPropertyNames(obj).includes("hasOwnProperty")) {
    propertyNames.push(...Object.getOwnPropertyNames(obj));
    obj = Object.getPrototypeOf(obj);
  }
  return propertyNames;
}
// Constructs an API-specific IPC name for a method.
export function toIpcName(apiClassName: string, methodName: string): string {
  return `${apiClassName}:${methodName}`;
}

// Utility for retrying a function until success or timeout.
export function retryUntilTimeout(
  elapsedMillis: number,
  attemptFunc: () => boolean,
  timeoutMessage: string
): void {
  if (!attemptFunc()) {
    if (elapsedMillis >= _bindingTimeoutMillis) {
      throw Error(timeoutMessage);
    }
    setTimeout(
      () =>
        retryUntilTimeout(
          elapsedMillis + _RETRY_MILLIS,
          attemptFunc,
          timeoutMessage
        ),
      _RETRY_MILLIS
    );
  }
}
