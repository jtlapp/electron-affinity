import { RecoverableClass } from "../../src/shared_ipc";

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

  static recover(obj: any): Catter {
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

  static recover(obj: any): CustomError {
    return new CustomError(obj.message, obj.code);
  }
}

const recoveryMap: Record<string, RecoverableClass<any>> = {
  Catter,
  CustomError,
};

export function recoverer(className: string, obj: { [key: string]: any }) {
  const recoverableClass = recoveryMap[className];
  return recoverableClass === undefined
    ? obj
    : recoverableClass["recover"](obj);
}
