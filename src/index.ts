import { PromiseType } from "utility-types";

type FunctionCall = {
  id: number;
  function: (...args: any) => any;
  arguments: any[];
  instance: any;
};

let NEXT_CALL_ID = 0;
let calls: WeakMap<(...args: any) => any, FunctionCall[]> = new WeakMap();

export function mock<T>(values: Partial<Extract<T, {}>> = {}) {
  for (const key in values) {
    if (typeof values[key] === "function") {
      Object.defineProperty(values[key], "name", { value: key });
    }
  }
  return values as any as T;
}

export function spy<T>(
  ...functions: Extract<T, (...args: any) => any>[]
): Extract<T, (...args: any) => any> {
  const functionCalls: FunctionCall[] = [];
  const functionMock = function (this: any, ...args: any): any {
    const callIndex = functionCalls.length;
    functionCalls.push({
      arguments: [...args],
      function: functionMock,
      id: NEXT_CALL_ID++,
      instance: this,
    });

    const fn =
      callIndex < functions.length
        ? functions[callIndex]
        : functions[functions.length - 1];
    if (!fn) return;
    return (fn as any)(...args);
  };
  calls.set(functionMock, functionCalls);
  return functionMock as any;
}

export function returns<T, F = Extract<T, (...args: any) => any>>(
  ...args: ReturnType<Extract<T, (...args: any) => any>> extends void
    ? []
    : [ReturnType<Extract<T, (...args: any) => any>>]
): T {
  return spy<F>((() => args[0]) as any) as any;
}
export function throws<T, F = Extract<T, (...args: any) => any>>(err: any): T {
  return spy<F>((() => {
    throw err;
  }) as any as any) as any;
}
export function resolves<T, F = Extract<T, (...args: any) => any>>(
  ...args: PromiseType<
    ReturnType<Extract<T, (...args: any) => any>>
  > extends void
    ? []
    : [PromiseType<ReturnType<Extract<T, (...args: any) => any>>>]
): T {
  return spy<F>((() => Promise.resolve(args[0])) as any) as any;
}
export function rejects<T, F = Extract<T, (...args: any) => any>>(
  error: any
): T {
  return spy<F>((() => Promise.reject(error)) as any) as any;
}

function getFunctionCalls(fn: (...args: any) => any) {
  const functionCalls = calls.get(fn as any);
  if (!functionCalls)
    throw Error("argument passed into 'callsOf' is not a function mock");
  return functionCalls;
}

export function callsOf<F>(
  fn: F
): Parameters<Extract<F, (...args: any) => any>>[] {
  return getFunctionCalls(fn as any).map((call) => call.arguments) as any;
}

function getOrderedCalls(...functions: Array<(...args: any) => any>) {
  return functions
    .map(getFunctionCalls)
    .flat()
    .sort((a, b) => a.id - (b as any).id);
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
