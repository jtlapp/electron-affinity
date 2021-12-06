export const EXPOSE_API_EVENT = "expose_class_api";

type PrivateProperty<P> = P extends `_${string}`
  ? P
  : P extends `#${string}`
  ? P
  : never;

type PublicProperty<P> = P extends PrivateProperty<P>
  ? never
  : P extends string
  ? P
  : never;

export type InvokeApi<T> = {
  [K in keyof T]: K extends PublicProperty<K>
    ? (...args: any[]) => Promise<any>
    : any;
};

export interface ApiRegistration {
  className: string;
  methodNames: string[];
}

export type ApiRegistrationMap = Record<string, string[]>;

export function toIpcName(apiClassName: string, methodName: string) {
  return `${apiClassName}:${methodName}`;
}
