## testtriple

A handy little testing library inspired by testdoubles.
It's main features are:

- easily creating nested mocks
- inferring types wherever possible
- make it possible to completely separate arrange/assert

testtriple completely focuses on mocking and leaves assertions to your test runner of choice.

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
      getAge: returns(90),
    }),
  }),
});

console.log(bob.name); // "bob"
console.log(bob.father.birthDate); // Date(1970,1,1)
console.log(bob.father.mother.getAge()); // 90
```

## mocking properties

You can use the `mock<T>({...[subset of T]...})` function to create an object that only has some values set, but pretends to be a complete object. This can also be nested as deep as desired, whith all types being inferred.

```ts
const bob = mock<Human>({
  father: mock({
    mother: mock({
      name: "helen",
    }),
  }),
});
console.log(bob.father.mother.name); // "helen"
```

## mocking function calls

To mock function calls of an object created with `mock({...})` you have to explicitly set the property to function mock created using one of the functions below:

### returns(valueToReturn)

```ts
const bob = mock<Human>({
  getAge: returns(10),
});
console.log(bob.getAge()); // 10
```

### throws(errorToThrow)

```ts
const eve = mock<Human>({
  getAge: throws("You don't ask the age of a women!"),
});
console.log(eve.getAge()); // throws "You don't ask the age of a women!"
```

### resolves(valueToResolve)

```ts
const bob = mock<Human>({
  getAge: resolves(10),
});
console.log(await bob.getAge()); // 10
```

### throws(errorToThrow)

```ts
const eve = mock<Human>({
  getAge: rejects("You don't ask the age of a women!"),
});
console.log(await eve.getAge()); // // throws "You don't ask the age of a women!"
```

### spy(...fns[])

This is the basic function that's used by all function mockers above. It takes one or more mimick functions. On every call of the original function, the next mimick function get's called and it's return value returned.

```ts
const bob = mock<Human>({
  getAge: spy(
    () => 10,
    () => 20,
    () => 30
  ),
});
console.log(bob.getAge()); // 10
console.log(bob.getAge()); // 20
console.log(bob.getAge()); // 30
```

It can also be used to chain `returns`,`throws`,`resolves` and `rejects`

```ts
const bob = mock<Human>({
  getAge: spy(returns(10), resolves(20), throws("he's dead, jim!")),
});
console.log(bob.getAge()); // 10
console.log(await bob.getAge()); // 20
console.log(bob.getAge()); // throws "he's dead, jim!"
```

## verifying calls

testtriple doesn't do any assertions. But it gives you access to function calls and their parameters using `callsOf(functionMock)`. You can then assert these calls using the test runner of your choice. Here's an example using jest:

```ts
const bob = mock<Human>({
  setName: spy(),
});

bob.setName("carl");
bob.setName("ben");
bob.setName("steve");

expect(callsOf(bob.setName)).toStrictEqual([["carl"], ["ben"], ["steve"]]);
```

## why is it called `testtriple`

I was lazy and just took the word `double` from `testdouble`, and made it `triple` instead. But I'm sure you've already got that :D

## license

MIT
