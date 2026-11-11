import {
  spy,
  callsOf,
  returns,
  throws,
  resolves,
  rejects,
  callOrderOf,
  callsOfAll,
  callDetailsOf,
} from "./spy";
import { createMockable, overrideMockable } from "./mockable";
import { Human } from "./test-types";
import { mock } from "./mock";

describe("spy", () => {
  it("returns", () => {
    const bob = mock<Human>({ getAge: returns(10) });
    expect(bob.getAge()).toBe(10);
  });
  it("returns void", () => {
    const bob = mock<Human>({ setName: returns() });
  });
  it("throws", () => {
    const bob = mock<Human>({
      getAge: throws("holy fuck"),
    });
    expect(bob.getAge).toThrow("holy fuck");
  });
  it("resolves", async () => {
    const bob = mock<Human>({ getAgeAsync: resolves(10) });
    expect(await bob.getAgeAsync()).toBe(10);
  });

  it("resolves void", async () => {
    const bob = mock<Human>({
      setNameAsync: resolves(),
    });
  });
  it("rejects", async () => {
    const bob = mock<Human>({
      getAgeAsync: rejects("holy fuck"),
    });
    await expect(bob.getAgeAsync).rejects.toEqual("holy fuck");
  });
  it("chains", () => {
    const results = [10, 20, 30, 40];
    const bob = mock<Human>({
      getAge: spy(returns(10), returns(20), returns(30), returns(40)),
    });
    expect([bob.getAge(), bob.getAge(), bob.getAge(), bob.getAge()]).toStrictEqual(results);
  });
  it("mimicks", () => {
    const bob = mock<Human>({
      getAge: spy(() => 10),
    });
    expect(bob.getAge()).toBe(10);
  });
  it("returns undefined when no return action was specified", () => {
    const bob = mock<Human>({
      getAge: spy(),
    });
    expect(bob.getAge()).toBeUndefined();
  });
  it("returns deeply nested as well", () => {
    mock<Human>({
      getFather: returns(
        mock({
          getFather: returns(
            mock({
              getAge: returns(1),
            }),
          ),
        }),
      ),
      father: mock({
        father: mock({
          getAge: returns(1),
        }),
      }),
    });
  });
  it("spy defaults to function without arguments returning nothing", () => {
    const fn = spy();
    fn();
  });
});

describe("callsOf", () => {
  it("returns all arguments of all calls", () => {
    const bob = mock<Human>({
      setName: spy(),
    });

    bob.setName("carl");
    bob.setName("ben");
    bob.setName("steve");

    expect(callsOf(bob.setName)).toStrictEqual([["carl"], ["ben"], ["steve"]]);
  });

  it("prints a nice message when calling it without a valid mock", () => {
    const bob = mock<Human>();
    expect(() => callsOf(bob.setName)).toThrow(
      "argument passed into 'callsOf' is not a function mock",
    );
  });

  it("can handle optional methods", () => {
    const bob = mock<{ optionalMethod?: () => void }>({
      optionalMethod: spy(),
    });

    expect(callsOf(bob.optionalMethod)).toStrictEqual([]);
  });
});

describe("callsOf, callsOfAll, callOrderOf", () => {
  it("returns the correct call orders for case 1", () => {
    const { a, b, c } = mock<{
      a: () => void;
      b: () => void;
      c: () => void;
    }>({
      a: spy(),
      b: spy(),
      c: spy(),
    });
    a();
    b();
    c();
    b();
    a();

    expect(callsOf(a)).toStrictEqual([[], []]);
    expect(callsOf(b)).toStrictEqual([[], []]);
    expect(callsOf(c)).toStrictEqual([[]]);
    expect(callsOfAll(a, b, c)).toStrictEqual([[a], [b], [c], [b], [a]]);
    expect(callsOfAll(a, c)).toStrictEqual([[a], [c], [a]]);
    expect(callOrderOf(a, b, c)).toStrictEqual([a, b, c, b, a]);
    expect(callOrderOf(a, b)).toStrictEqual([a, b, b, a]);
  });

  it("returns the correct call orders for case 1", () => {
    const { a, b } = mock<{
      a: (x: string) => void;
      b: (y: number, z: boolean) => void;
    }>({
      a: spy(),
      b: spy(),
    });
    a("hello");
    b(1, true);
    a("world");
    b(2, false);

    expect(callsOf(a)).toStrictEqual([["hello"], ["world"]]);
    expect(callsOf(b)).toStrictEqual([
      [1, true],
      [2, false],
    ]);
    expect(callsOfAll(a, b)).toStrictEqual([
      [a, "hello"],
      [b, 1, true],
      [a, "world"],
      [b, 2, false],
    ]);
    expect(callOrderOf(a, b)).toStrictEqual([a, b, a, b]);
  });

  it("infers the correct call type", () => {
    const fn = spy<(one: string, two: number) => void>();
    fn("1", 1);
    fn("2", 2);

    const firstArgOfSecondCall: string = callsOf(fn)[1][0];
    const secondArgOfFirstCall: number = callsOf(fn)[0][1];
    expect(firstArgOfSecondCall).toBe("2");
    expect(secondArgOfFirstCall).toBe(1);
  });

  it("uses the original function, not the proxy", () => {
    const proxy = createMockable({ setCount: (count: number) => {} });
    overrideMockable(proxy, mock({ setCount: spy() }));
    proxy.setCount(3);

    expect(callsOf(proxy.setCount)).toStrictEqual([[3]]);
  });
});

describe("callDetailsOf", () => {
  it("returns the correct call details", () => {
    const fn = spy();
    fn();
    fn();
    fn();
    const details = callDetailsOf(fn);
    expect(details.called).toBe(true);
    expect(details.callCount).toBe(3);
  });

  it("returns the correct call details for a function that was never called", () => {
    const fn = spy();
    const details = callDetailsOf(fn);
    expect(details.called).toBe(false);
    expect(details.callCount).toBe(0);
  });
});
