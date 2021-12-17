import * as td from "testdouble";
export * from "testdouble";

export function mock<T extends object, B extends Partial<T> = Partial<T>>(
  values: B = {} as any
) {
  return (values as any) as T;
}

export function spy<T>() {
  return td.func<T>();
}
