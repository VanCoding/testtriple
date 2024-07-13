import { PromiseType } from "utility-types";

type FunctionCall = {
  id: number;
  function: (...args: any) => any;
  arguments: any[];
  instance: any;
};

let NEXT_CALL_ID = 0;
let calls: WeakMap<(...args: any) => any, FunctionCall[]> = new WeakMap();

type ExtractOrVoid<T, Target> = Extract<T, Target> extends never
  ? void
  : Extract<T, Target>;

export function mock<T>(values: Partial<Extract<T, {}>> = {}) {
  for (const key in values) {
    if (typeof values[key] === "function") {
      Object.defineProperty(values[key], "name", { value: key });
    }
  }
  return values as ExtractOrVoid<T, Record<any, any>>;
}

export function spy<T = () => void>(
  ...functions: Extract<T, (...args: any) => any>[]
): ExtractOrVoid<T, (...args: any) => any> {
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

export function returns<T>(
  ...args: ReturnType<Extract<T, (...args: any) => any>> extends void
    ? []
    : [ReturnType<Extract<T, (...args: any) => any>>]
): Extract<T, (...args: any) => any> {
  return spy<T>((() => args[0]) as any) as any;
}
export function throws<T>(err: any): Extract<T, (...args: any) => any> {
  return spy<T>((() => {
    throw err;
  }) as any as any) as any;
}
export function resolves<T>(
  ...args: PromiseType<
    ReturnType<Extract<T, (...args: any) => any>>
  > extends void
    ? []
    : [PromiseType<ReturnType<Extract<T, (...args: any) => any>>>]
): Extract<T, (...args: any) => any> {
  return spy<T>((() => Promise.resolve(args[0])) as any) as any;
}
export function rejects<T>(error: any): Extract<T, (...args: any) => any> {
  return spy<T>((() => Promise.reject(error)) as any) as any;
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

type Details = {
  called: boolean;
  callCount: number;
};

export function callDetailsOf(fn: (...args: any) => any): Details {
  const details = callsOf(fn);
  return {
    called: details.length > 0,
    callCount: details.length,
  };
}
