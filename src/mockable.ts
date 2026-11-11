const proxies: WeakMap<object, () => unknown> = new WeakMap();
const mocks: WeakMap<object, object> = new WeakMap();

export const createMockableFactory =
  (condition: () => boolean) =>
  <T extends object>(value: T): T => {
    const enableProxies = condition();
    if (enableProxies) {
      return createMockable(value);
    }
    return value;
  };

export const createMockable = <T extends object>(value: T): T => {
  if (typeof value !== "object" && typeof value !== "function") {
    throw new Error("cannot create proxy for non-object value");
  }
  let proxy: T;
  proxy = createProxyFromGetter((): T => (proxy ? (mocks.get(proxy) as T) : undefined) || value);
  return proxy;
};

const createProxyFromGetter = <T extends object>(getValue: () => T): T => {
  const target = (typeof getValue() === "function" ? () => undefined : {}) as T;
  const proxy = new Proxy<T>(target, {
    get: (_target, property) => {
      const value = getValue();
      if (!Object.hasOwn(value, property)) {
        return undefined;
      }
      if (typeof value !== "function" && typeof value !== "object") {
        return value;
      }
      const getProperty = makeGetOriginal(getValue, property as keyof T);
      return createProxyFromGetter(getProperty);
    },
    apply: (_target, thisArg, args) => {
      const receiver = isObject(thisArg) ? (proxies.get(thisArg)?.() ?? thisArg) : thisArg;
      return Reflect.apply(getValue() as () => any, receiver, args);
    },
    defineProperty: (_target, property, descriptor) => {
      return Reflect.defineProperty(getValue() as object, property, descriptor);
    },
    deleteProperty: (_target, property) => {
      return Reflect.deleteProperty(getValue() as object, property);
    },
    has: (_target, property) => {
      if (typeof getValue() !== "object" && typeof getValue() !== "function") {
        return false;
      }
      return Reflect.has(getValue() as object, property);
    },
    ownKeys: (_target) => {
      return Reflect.ownKeys(getValue() as object);
    },
    getOwnPropertyDescriptor: (_target, property) => {
      return Reflect.getOwnPropertyDescriptor(getValue() as object, property);
    },
    set: (_target, property, value, receiver) => {
      return Reflect.set(getValue() as object, property, value, receiver);
    },
    preventExtensions: (_target) => {
      return Reflect.preventExtensions(getValue() as object);
    },
    isExtensible: (_target) => {
      return Reflect.isExtensible(getValue() as object);
    },
    getPrototypeOf: (_target) => {
      if (typeof getValue() !== "object" && typeof getValue() !== "function") {
        return null;
      }
      return Reflect.getPrototypeOf(getValue() as object);
    },
    construct: (_target, args, newTarget) => {
      return Reflect.construct(getValue() as () => any, args, newTarget);
    },
  });
  proxies.set(proxy, getValue);
  return proxy;
};

const makeGetOriginal = <T extends object, P extends keyof T>(getValue: () => T, property: P) => {
  return () => {
    const value = getValue();
    return Reflect.get(value as object, property);
  };
};

export const getOriginal = <T>(proxy: T): T => {
  const getValue = isObject(proxy) ? proxies.get(proxy) : undefined;
  if (!getValue) {
    return proxy;
  }
  return getValue() as T;
};

export const overrideMockable = <T extends object>(proxy: T, mock: T) => {
  mocks.set(proxy, mock);
};

function isObject(value: unknown): value is object {
  return (typeof value === "object" && value !== null) || typeof value === "function";
}
