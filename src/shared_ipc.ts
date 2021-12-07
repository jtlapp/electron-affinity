export const EXPOSE_API_EVENT = "expose_class_api";

const RETRY_MILLIS = 50;

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

export type ReturnsPromise<M> = M extends (...args: any[]) => Promise<any>
  ? M
  : never;

export interface ApiRegistration {
  className: string;
  methodNames: string[];
}

export type ApiRegistrationMap = Record<string, string[]>;

export function toIpcName(apiClassName: string, methodName: string) {
  return `${apiClassName}:${methodName}`;
}

export function retryUntilTimeout(
  elapsedMillis: number,
  attemptFunc: () => boolean,
  timeoutMillis: number,
  timeoutMessage: string
): void {
  if (!attemptFunc()) {
    if (elapsedMillis >= timeoutMillis) {
      throw Error(timeoutMessage);
    }
    setTimeout(
      () =>
        retryUntilTimeout(
          elapsedMillis + RETRY_MILLIS,
          attemptFunc,
          timeoutMillis,
          timeoutMessage
        ),
      RETRY_MILLIS
    );
  }
}
