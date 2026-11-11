import {
  createMockable,
  createMockableFactory,
  getOriginal,
  overrideMockable,
  partiallyOverrideMockable,
  resetMockable,
} from "./mockable";

describe("createMockableFactory", () => {
  it("returns proxy if condition is true", () => {
    const factory = createMockableFactory(() => true);
    const adapter = { value: 42 };
    const proxy = factory(adapter);

    expect(proxy).not.toBe(adapter);
    expect(getOriginal(proxy)).toBe(adapter);
  });

  it("returns the original value if condition is false", () => {
    const factory = createMockableFactory(() => false);
    const adapter = { value: 42 };
    const proxy = factory(adapter);

    expect(proxy).toBe(adapter);
  });
});

describe("createMockable", () => {
  it("returns proxies for values while exposing their originals", () => {
    const adapter = {
      value: 42,
      nested: { name: "alice" },
    };
    const proxy = createMockable(adapter);

    expect(getOriginal(proxy)).toBe(adapter);
    expect(getOriginal(proxy.value)).toBe(42);
    expect(getOriginal(proxy.nested)).toBe(adapter.nested);
    expect(getOriginal(proxy.nested.name)).toBe("alice");
  });

  it("forwards property changes and reflection to the original object", () => {
    const adapter: { value: number; removed?: boolean } = { value: 1, removed: true };
    const proxy = createMockable(adapter);

    proxy.value = 2;
    expect(adapter.value).toBe(2);
    expect("value" in proxy).toBe(true);
    expect(Object.keys(proxy)).toEqual(["value", "removed"]);
    expect(delete proxy.removed).toBe(true);
    expect("removed" in adapter).toBe(false);
  });

  it("calls proxied methods with the proxy as their receiver", () => {
    const adapter = {
      value: 42,
      getValue() {
        return this.value;
      },
    };
    const proxy = createMockable(adapter);

    expect(proxy.getValue()).toBe(42);
  });

  it("uses a mock as the original value and resolves nested proxies dynamically", () => {
    const adapter = { nested: { value: 1 } };
    const mock = { nested: { value: 2 } };
    const proxy = createMockable(adapter);
    const nestedProxy = proxy.nested;

    overrideMockable(proxy, mock);

    expect(getOriginal(proxy)).toBe(mock);
    expect(getOriginal(nestedProxy)).toBe(mock.nested);
    expect(getOriginal(nestedProxy.value)).toBe(2);
  });

  it("allows mocking after getting a nested function", () => {
    const mockable = createMockable({
      nested: {
        getValue: (): number => 1,
      },
    });

    const getValue = mockable.nested.getValue;

    overrideMockable(mockable, {
      nested: {
        getValue: (): number => 2,
      },
    });

    expect(getValue()).toBe(2);
  });

  it("partially overrides with a new object without modifying the original", () => {
    const adapter = { nested: { value: 1, name: "original" } };
    const proxy = createMockable(adapter);

    partiallyOverrideMockable(proxy, { nested: { value: 2 } });

    expect(getOriginal(proxy.nested.value)).toBe(2);
    expect(getOriginal(proxy.nested.name)).toBe("original");
    expect(adapter).toEqual({ nested: { value: 1, name: "original" } });
    expect(getOriginal(proxy)).not.toBe(adapter);
    expect(getOriginal(proxy).nested).not.toBe(adapter.nested);
    expect(getOriginal(proxy)).toEqual({ nested: { value: 2, name: "original" } });
  });

  it("resets overrides to the initial value", () => {
    const adapter = { value: 1 };
    const proxy = createMockable(adapter);

    partiallyOverrideMockable(proxy, { value: 2 });
    resetMockable(proxy);

    expect(getOriginal(proxy.value)).toBe(1);
    expect(getOriginal(proxy)).toBe(adapter);
  });

  it("returns non-proxy values unchanged", () => {
    const value = {};

    expect(getOriginal(value)).toBe(value);
  });
});
