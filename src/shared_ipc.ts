/**
 * Code used by both main and renderer processes.
 */

// Name of IPC announcing the availability of an API.
export const EXPOSE_API_EVENT = "expose_class_api";

// Name of IPC announcing that an API was bound.
export const BOUND_API_EVENT = "bound_class_api";

// Period between attempts to announce or bind an API.
const _RETRY_MILLIS = 50;

// Configurable timeout attempting to announce or bind an API.
let _bindingTimeoutMillis = 500;

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
  windowID: number;
  className: string;
  methodNames: string[];
};

// Structure sent to main announcing the binding of a main API.
export type ApiBinding = {
  windowID: number;
  className: string;
};

// Structure associating API names with names of methods in the API.
export type ApiRegistrationMap = Record<string, string[]>;

// Constructs an API-specific IPC name for a method.
export function toIpcName(apiClassName: string, methodName: string) {
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
