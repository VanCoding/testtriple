import { PromiseType } from "utility-types";

let NEXT_CALL_ID = 0;

export function mock<T>(values: Partial<Extract<T, {}>> = {}) {
  for (const key in values) {
    if (typeof values[key] === "function") {
      Object.defineProperty(values[key], "name", { value: key });
    }
  }
  return (values as any) as T;
}

export function spy<T>(
  ...functions: Extract<T, (...args: any) => any>[]
): Extract<T, (...args: any) => any> {
  const calls: any = [];
  let callIndex = -1;
  const functionMock = function (...args: any): any {
    const call = [...args];
    Object.defineProperty(call as any, "id", {
      enumerable: false,
      writable: false,
      value: NEXT_CALL_ID++,
    });
    calls.push(call);
    callIndex++;

    const fn =
      callIndex < functions.length
        ? functions[callIndex]
        : functions[functions.length - 1];
    if (!fn) return;
    return (fn as any)(...args);
  };
  Object.defineProperty(functionMock as any, "calls", {
    enumerable: false,
    writable: false,
    value: calls,
  });
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

function getOrderedCalls(...functions: Array<(...args: any) => any>) {
  return functions
    .map((fn) =>
      callsOf(fn).map((call: any) => ({
        id: call.id,
        function: fn,
        arguments: call,
      }))
    )
    .flat()
    .sort((a, b) => (a as any).id - (b as any).id);
}

export function callsOfAll(...functions: Array<(...args: any) => any>) {
  return getOrderedCalls(...functions).map((call) => [
    call.function,
    ...call.arguments,
  ]);
}

export function callOrderOf(
  ...functions: Array<(...args: any) => any>
): Array<(...args: any) => any> {
  return getOrderedCalls(...functions).map((call) => call.function);
}
