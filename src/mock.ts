import { ExtractOrVoid } from "./types";

export function mock<T>(values: Partial<Extract<T, {}>> = {}) {
  for (const key in values) {
    if (typeof values[key] === "function") {
      Object.defineProperty(values[key], "name", { value: key });
    }
  }
  return values as ExtractOrVoid<T, Record<any, any>>;
}
