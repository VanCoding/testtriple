export type ExtractOrVoid<T, Target> = Extract<T, Target> extends never ? void : Extract<T, Target>;
