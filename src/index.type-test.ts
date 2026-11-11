import { callsOf, mock, resolves, returns, spy } from ".";

type Human = {
  name: string;
  birthDate: Date;
  getAge: () => number;
  getAgeAsync: () => Promise<number>;
  setName: (name: string) => void;
  setNameAsync: (name: string) => void;
  mother: Human;
  father: Human;
};

mock<Human>({
  // @ts-expect-error A mock property must match the declared type.
  name: 1,
});

mock<Human>({
  father: mock({
    mother: mock({
      // @ts-expect-error A nested mock property must match the declared type.
      name: 1,
    }),
  }),
});

mock<Human>({
  // @ts-expect-error A non-function property cannot be mocked with a spy.
  name: spy(),
});

mock<Human>({
  getAge: returns(
    // @ts-expect-error getAge must return a number.
    "hello",
  ),
});

mock<Human>({
  getAge:
    // @ts-expect-error getAge requires a return value.
    returns(),
});

mock<Human>({
  getAgeAsync: resolves(
    // @ts-expect-error getAgeAsync must resolve to a number.
    "hello",
  ),
});

mock<Human>({
  getAgeAsync:
    // @ts-expect-error getAgeAsync requires a resolve value.
    resolves(),
});

mock<Human>({
  setNameAsync: resolves(
    // @ts-expect-error setNameAsync resolves to void and accepts no value.
    10,
  ),
});

const bob = mock<Human>({ setName: spy() });
// @ts-expect-error callsOf returns the declared argument type.
const name: number = callsOf(bob.setName)[0][0];
