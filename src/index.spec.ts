import { mock, spy, callsOf, returns, throws, resolves, rejects } from ".";
import { spawnSync } from "child_process";

type Human = {
  name: string;
  birthDate: Date;
  getAge: () => number;
  getAgeAsync: () => Promise<number>;
  setName: (name: string) => void;
  mother: Human;
  father: Human;
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
});

describe("spy", () => {
  it("returns", () => {
    const bob = mock<Human>({ getAge: returns(10) });
    expect(bob.getAge()).toBe(10);
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

describe("type inferrence", () => {
  it("prevents setting invalid values to mock properties", () => {
    doesNotCompile(
      "mock<Human>({name:1})",
      "Type 'number' is not assignable to type 'string | undefined'"
    );
  });
  it("prevents setting invalid valid to nested mock properties", () => {
    doesNotCompile(
      "mock<Human>({father:mock({mother:mock({name:1})})})",
      "Type 'number' is not assignable to type 'string | undefined'"
    );
  });
  it("prevents setting mocks to non-function mock properties", () => {
    doesNotCompile(
      "mock<Human>({name:returns('bob')})",
      "Argument of type 'string' is not assignable to parameter of type 'never'"
    );
  });
  it("prevents setting an invalid return value for a mock function", () => {
    doesNotCompile(
      "mock<Human>({getAge: returns('hello')})",
      "Argument of type 'string' is not assignable to parameter of type 'number'"
    );
  });
  it("prevents setting an invalid resolve value for a mock function", () => {
    doesNotCompile(
      "mock<Human>({getAgeAsync: resolves('hello')})",
      "Argument of type 'string' is not assignable to parameter of type 'number'"
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
