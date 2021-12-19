import { PromiseType } from "utility-types";

export function mock<T>(values: Partial<Extract<T, {}>> = {}) {
  return (values as any) as T;
}

export function spy<T>(
  ...functions: Extract<T, (...args: any) => any>[]
): Extract<T, (...args: any) => any> {
  const calls: any = [];
  let callIndex = -1;
  const functionMock = function (...args: any): any {
    calls.push(args);
    callIndex++;

    const fn =
      callIndex < functions.length
        ? functions[callIndex]
        : functions[functions.length - 1];
    if (!fn) return;
    return (fn as any)(...args);
  };
  functionMock.calls = calls;
  return functionMock as any;
}

export function returns<T, F = Extract<T, (...args: any) => any>>(
  value: ReturnType<Extract<T, (...args: any) => any>>
): T {
  return spy<F>((() => value) as any) as any;
}
export function throws<T, F = Extract<T, (...args: any) => any>>(err: any): T {
  return spy<F>(((() => {
    throw err;
  }) as any) as any) as any;
}
export function resolves<T, F = Extract<T, (...args: any) => any>>(
  value: PromiseType<ReturnType<Extract<T, (...args: any) => any>>>
): T {
  return spy<F>((() => Promise.resolve(value)) as any) as any;
}
export function rejects<T, F = Extract<T, (...args: any) => any>>(
  error: any
): T {
  return spy<F>((() => Promise.reject(error)) as any) as any;
}

export function callsOf<F>(
  fn: F
): Parameters<Extract<F, (...args: any) => any>> {
  const functionMock = fn as any;
  if (!functionMock || !functionMock.calls)
    throw Error("argument passed into 'callsOf' is not a function mock");
  return functionMock.calls as any;
}
