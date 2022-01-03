export const EXPOSE_API_EVENT = "expose_class_api";
export const BOUND_API_EVENT = "bound_class_api";

const _RETRY_MILLIS = 50;
let _bindingTimeoutMillis = 500;

export type PrivateProperty<P> = P extends `_${string}`
  ? P
  : P extends `#${string}`
  ? P
  : never;

export type PublicProperty<P> = P extends PrivateProperty<P>
  ? never
  : P extends string
  ? P
  : never;

export type ApiRegistration = {
  windowID: number;
  className: string;
  methodNames: string[];
};

export type ApiBinding = {
  windowID: number;
  className: string;
};

export type ApiRegistrationMap = Record<string, string[]>;

export function toIpcName(apiClassName: string, methodName: string) {
  return `${apiClassName}:${methodName}`;
}

export function setIpcBindingTimeout(millis: number): void {
  _bindingTimeoutMillis = millis;
}

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
