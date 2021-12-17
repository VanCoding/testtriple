import { mock, spy, when } from ".";

type Human = {
  name: string;
  birthDate: Date;
  getAge: () => number;
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
  it("infers type inside mock", () => {
    const bob = mock<Human>({ getAge: spy() });
    when(bob.getAge()).thenReturn(10);

    expect(bob.getAge()).toBe(10);
  });
});
