import {
  mock,
  spy,
  callsOf,
  returns,
  throws,
  resolves,
  rejects,
  callOrderOf,
  callsOfAll,
  callDetailsOf,
} from ".";
import { spawnSync } from "child_process";

type Human = {
  name: string;
  birthDate: Date;
  getAge: () => number;
  getAgeAsync: () => Promise<number>;
  setName: (name: string) => void;
  setNameAsync: (name: string) => void;
  mother: Human;
  father: Human;
  getFather: () => Human;
};

describe("mock", () => {
  it("sets specified properties", () => {
    const bob = mock<Human>({ name: "bob" });
    expect(bob.name).toBe("bob");
  });

  it("infers type when nested", () => {
    const bob = mock<Human>({
      father: mock({
        mother: mock({ name: "helen" }),
      }),
    });

    expect(bob.father.mother.name).toBe("helen");
  });

  it("allows zero arguments", () => {
    mock<Human>();
  });

  it("supports inferred mock inside returns", () => {
    mock<Human>({
      getFather: returns(mock()),
    });
  });

  it("sets the name of functions correclty", () => {
    const bob = mock<Human>({
      getAge: returns(10),
    });

    expect(bob.getAge.name).toBe("getAge");
  });
});

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
    expect([
      bob.getAge(),
      bob.getAge(),
      bob.getAge(),
      bob.getAge(),
    ]).toStrictEqual(results);
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
            })
          ),
        })
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
      "argument passed into 'callsOf' is not a function mock"
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

describe("type inferrence", () => {
  it("prevents setting invalid values to mock properties", () => {
    doesNotCompile(
      "mock<Human>({name:1})",
      "Type 'number' is not assignable to type 'string'"
    );
  });
  it("prevents setting invalid valid to nested mock properties", () => {
    doesNotCompile(
      "mock<Human>({father:mock({mother:mock({name:1})})})",
      "Type 'number' is not assignable to type 'string'"
    );
  });
  it("prevents setting mocks to non-function mock properties", () => {
    doesNotCompile(
      "mock<Human>({name:spy()})",
      "Type 'void' is not assignable to type 'string | undefined'"
    );
  });
  it("prevents setting an invalid return value for a mock function", () => {
    doesNotCompile(
      "mock<Human>({getAge: returns('hello')})",
      "Argument of type 'string' is not assignable to parameter of type 'number'"
    );
  });

  it("prevents not setting a return value for a mock function not returning void", () => {
    doesNotCompile(
      "mock<Human>({getAge: returns()})",
      "Expected 1 arguments, but got 0."
    );
  });

  it("prevents setting an invalid resolve value for a mock function", () => {
    doesNotCompile(
      "mock<Human>({getAgeAsync: resolves('hello')})",
      "Argument of type 'string' is not assignable to parameter of type 'number'"
    );
  });

  it("prevents not setting a resolve value for a mock function not returning void", () => {
    doesNotCompile(
      "mock<Human>({getAgeAsync: resolves()})",
      "Expected 1 arguments, but got 0."
    );
  });

  it("prevents setting a resolve value for a mock function returning void", () => {
    doesNotCompile(
      "mock<Human>({setNameAsync: resolves(10)})",
      "Expected 0 arguments, but got 1."
    );
  });

  it("correctly detects callsOf type", () => {
    doesNotCompile(
      `
      const bob = mock<Human>({setName: spy()});
      const name: number = callsOf(bob.setName)[0][0]
    `,
      "Type 'string' is not assignable to type 'number'"
    );
  });
});

function doesNotCompile(code: string, message: string) {
  const allCode = `
  import { mock, spy, callsOf, returns, throws, resolves, rejects } from "./src";
  type Human = {
    name: string;
    birthDate: Date;
    getAge: () => number;
    getAgeAsync: () => Promise<number>;
    setName: (name: string) => void;
    setNameAsync: ()=>Promise<void>;
    mother: Human;
    father: Human;
  };
  ${code}
  `;
  console.log(allCode);
  const result = spawnSync("ts-node", [
    "--project",
    "tsconfig.json",
    "--eval",
    allCode,
  ]);
  const output = result.output.join("");
  console.log(result.error, output);
  expect(output).toContain(message);
}
