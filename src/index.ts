import { PromiseType } from "utility-types";

export function mock<T extends object, B extends Partial<T> = Partial<T>>(
  values: B = {} as any
) {
  return (values as any) as T;
}

type FunctionMock<F extends (...args: any) => any> = {
  (...args: Parameters<F>): ReturnType<F>;
  calls: Parameters<F>[];
};

export function spy<F extends (...args: any) => any>(...functions: F[]): F {
  const calls: Parameters<F>[] = [];
  let callIndex = -1;
  const functionMock = function (...args: Parameters<F>): ReturnType<F> {
    calls.push(args);
    callIndex++;

    const fn =
      callIndex < functions.length
        ? functions[callIndex]
        : functions[functions.length - 1];
    if (!fn) return;
    return fn.apply(null, args);
  };
  functionMock.calls = calls;
  return functionMock as any;
}

export function returns<F extends (...args: any) => any>(value: ReturnType<F>) {
  return spy<F>((() => value) as F);
}
export function throws<F extends (...args: any) => any>(err: any) {
  return spy<F>(((() => {
    throw err;
  }) as any) as F);
}
export function resolves<F extends (...args: any) => Promise<any>>(
  value: PromiseType<ReturnType<F>>
) {
  return spy<F>((() => Promise.resolve(value)) as F);
}
export function rejects<F extends (...args: any) => Promise<any>>(error: any) {
  return spy<F>((() => Promise.reject(error)) as F);
}

export function callsOf<F extends (...args: any) => any>(
  fn: F
): Parameters<F>[] {
  const functionMock = (fn as any) as FunctionMock<F>;
  if (!functionMock || !functionMock.calls)
    throw Error("argument passed into 'callsOf' is not a function mock");
  return functionMock.calls;
}
