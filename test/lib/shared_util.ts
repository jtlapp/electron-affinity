import { genericRestorer } from "../../src/lib/restorer_lib";

export class Catter {
  s1: string;
  s2: string;

  constructor(s1: string, s2: string) {
    this.s1 = s1;
    this.s2 = s2;
  }

  cat(): string {
    return this.s1 + this.s2;
  }

  static restoreClass(obj: any): Catter {
    return new Catter(obj.s1, obj.s2);
  }
}

export class CustomError extends Error {
  code: number;

  constructor(message: string, code: number) {
    super(message);
    this.code = code;
    // see https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, CustomError.prototype);
  }

  static restoreClass(obj: any): CustomError {
    return new CustomError(obj.message, obj.code);
  }
}

export class NoMessageError extends Error {
  constructor() {
    super();
    // see https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, NoMessageError.prototype);
  }

  static restoreClass(_obj: any): NoMessageError {
    return new NoMessageError();
  }
}

export class NonErrorObject {
  value: string;

  constructor(value: string) {
    this.value = value;
  }

  static restoreClass(obj: any): NonErrorObject {
    return new NonErrorObject(obj.value);
  }
}

export const restorer = genericRestorer.bind(null, {
  Catter,
  CustomError,
  NoMessageError,
  NonErrorObject,
});

export async function sleep(delayMillis: number) {
  return new Promise<void>((resolve) => {
    setTimeout(() => resolve(), delayMillis);
  });
}
