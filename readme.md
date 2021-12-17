## testtriple

An extremely lightweight extension/wrapper around `testdouble` that allows to create & test nested mocks conveniently.
It exports everything from `testdouble` plus the additional functions `mock` and `spy`.

## quick example

```ts
type Human = {
  name: string;
  birthDate: Date;
  getAge: () => number;
  mother: Human;
  father: Human;
};

const bob = mock<Human>({
  name: "bob",
  father: mock({
    birthDate: new Date(1970, 1, 1),
    mother: mock({
      name: "helen",
      getAge: spy(),
    }),
  }),
});

when(bob.father.mother.getAge()).thenReturn(90);

console.log(bob.name); // "bob"
console.log(bob.father.birthDate); // Date(1970,1,1)
console.log(bob.father.mother.getAge()); // 90
```

## mocking properties

You can use the `mock<T>({...[subset of T]...})` function to create an object that only has some values set, but pretends to be a complete object.

```ts
const bob = mock<Human>({ name: "bob" });
```

## mocking function calls

To mock function calls of an object created with `mock({...})` you have to explicitly set the property to a `spy()`. This is because objects created by `mock({...})` are no special objects. They are really just objects pretending to be objects with more properties that they actually have. So if you want to spy on function of the object, you have to pass the function mock as well. `spy()` is exaclty the same as `func()` or `function()`, but it infers its type, when used inside the `mock({...})` call.

```ts
const bob = mock<Human>({
  getAge: spy(), //this is needed. otherwise bob.getAge would be undefined below.
});
when(bob.getAge()).thenReturn(10);
```

## nested mocks

When `mock({...})` is called inside mock, the type is inferred and doesn't have to be provided again.

```ts
const bob = mock<Human>({
  father: mock({
    mother: mock({
      name: "helen",
      getAge: spy(),
    }),
  }),
});
```

## why is it called `testtriple`

I was lazy and just took the word `double` from `testdouble`, and made it `triple` instead. But I'm sure you've already got that :D

## license

MIT
