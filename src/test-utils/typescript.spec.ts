import { doesCompile, doesNotCompile } from "./typescript";

describe("TypeScript test utilities", () => {
  it("accepts valid code", () => {
    doesCompile('mock<Human>({ name: "alice" });');
  });

  it("reports errors for invalid code", () => {
    doesNotCompile(
      "mock<Human>({ name: 42 });",
      "Type 'number' is not assignable to type 'string'",
    );
  });
});
