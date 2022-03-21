/**
 * Code used by both main and renderer processes.
 */

// Name of IPC requesting an API for binding.
export const API_REQUEST_IPC = "_affinity_api_request";

// Name of IPC providing information needed to bind to an API.
export const API_RESPONSE_IPC = "_affinity_api_response";

// Period between attempts to bind an API.
const _RETRY_MILLIS = 50;

// Configurable timeout attempting to bind an API.
let _bindingTimeoutMillis = 4000;

/**
 * Utility type for providing the value to which an asynchronous function
 * resolves. That is, if a function F returns Promise<R>, then AwaitedType<T>
 * evaluates to type R. Use for extracting the types of bound APIs.
 *
 * @param <F> Function for which to determine the resolving type.
 */
export type AwaitedType<F> = F extends (...args: any[]) => Promise<infer R>
  ? R
  : never;

/**
 * Sets the binding timeout. This is the maximum time allowed for the main
 * process to bind to any window API and the maximum time allowed for a
 * window to bind to a main API. Also applies to any bindings in progress.
 *
 * @param millis Duration of timeout in milliseconds
 */
export function setIpcBindingTimeout(millis: number): void {
  _bindingTimeoutMillis = millis;
}

// Matches object properties beginning with neither underscore nor pound.
export type PublicProperty<P> = P extends `_${string}`
  ? never
  : P extends `#${string}`
  ? never
  : P;

// Information needed to bind to a remote API.
export type ApiRegistration = {
  className: string;
  methodNames: string[];
};

// Structure associating API names with names of methods in the API.
export type ApiRegistrationMap = Record<string, string[]>;

// Generic API type, for either main or window.
type ElectronApi<T> = {
  [K in keyof T]: K extends PublicProperty<K> ? (...args: any[]) => any : any;
};

// Makes an API available for remote binding, installing method handlers.
export function exposeApi<T>(
  apiMap: ApiRegistrationMap,
  api: ElectronApi<T>,
  installHandler: (ipcName: string, method: any) => void
) {
  const apiClassName = api.constructor.name;
  if (apiMap[apiClassName]) {
    return; // was previously exposed
  }
  const methodNames: string[] = [];
  for (const methodName of getPropertyNames(api)) {
    if (methodName != "constructor" && !["_", "#"].includes(methodName[0])) {
      const method = (api as any)[methodName];
      if (typeof method == "function") {
        installHandler(toIpcName(apiClassName, methodName), method);
        methodNames.push(methodName);
      }
    }
  }
  apiMap[apiClassName] = methodNames;
}

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
