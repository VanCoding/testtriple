## testtriple

A handy little mocking library inspired by [testdouble](https://github.com/testdouble/testdouble.js) and [@fluffy-spoon/substitute](https://github.com/ffMathy/FluffySpoon.JavaScript.Testing.Faking).
It's main features are:

- easily creating nested mocks
- inferring types wherever possible
- make it possible to completely separate arrange/assert

testtriple completely focuses on mocking and leaves assertions to your test runner of choice.

## installation

`npm install testtriple`

## quick example

```ts
import { mock, returns } from "testtriple";

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
import { mock } from "testtriple";

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

To mock function calls of an object created with `mock({...})` you have to explicitly set the property to a function mock created using one of the functions below:

### returns(valueToReturn)

```ts
import { mock, returns } from "testtriple";

const bob = mock<Human>({
  getAge: returns(10),
});
console.log(bob.getAge()); // 10
```

### throws(errorToThrow)

```ts
import { mock, throws } from "testtriple";

const eve = mock<Human>({
  getAge: throws("You don't ask the age of a women!"),
});
console.log(eve.getAge()); // throws "You don't ask the age of a women!"
```

### resolves(valueToResolve)

```ts
import { mock, resolves } from "testtriple";

const bob = mock<Human>({
  getAge: resolves(10),
});
console.log(await bob.getAge()); // 10
```

### rejects(errorToThrow)

```ts
import { mock, rejects } from "testtriple";

const eve = mock<Human>({
  getAge: rejects("You don't ask the age of a women!"),
});
console.log(await eve.getAge()); // // throws "You don't ask the age of a women!"
```

### spy(...fns[])

This is the basic function that's used by all function mockers above. It takes one or more mimick functions. On every call of the original function, the next mimick function get's called and it's return value returned.

```ts
import { mock, spy } from "testtriple";

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
import { mock, spy, returns, resolves, throws } from "testtriple";

const bob = mock<Human>({
  getAge: spy(returns(10), resolves(20), throws("he's dead, jim!")),
});
console.log(bob.getAge()); // 10
console.log(await bob.getAge()); // 20
console.log(bob.getAge()); // throws "he's dead, jim!"
```

## verifying calls

testtriple doesn't do any assertions. But it gives you access to function calls and their parameters using `callsOf`, `callsOfAll`, `callOrderOf`, and `callDetailsOf`. You can then assert these calls using the test runner of your choice.

### callsOf(fn)

Used to verify the call order and arguments of a single function.

```ts
import { mock, spy, callsOf } from "testtriple";

const math = mock<Calulator>({
  add: spy(),
  multiply: spy(),
});

math.add(1, 2);
math.multiply(2, 2);
math.add(3, 8);

expect(callsOf(math.add)).toStrictEqual([
  [1, 2],
  [3, 8],
]);
```

### callsOfAll(...fns)

Used to verify the call order and arguments across multiple functions.

```ts
import { mock, spy, callsOfAll } from "testtriple";

const math = mock<Calulator>({
  add: spy(),
  multiply: spy(),
});

math.add(1, 2);
math.multiply(2, 2);
math.add(3, 8);

expect(callsOfAll(math.add, math.multiply)).toStrictEqual([
  [math.add, 1, 2],
  [math.multiply, 2, 2],
  [math.add, 3, 8],
]);
```

### callOrderOf(...fns)

Used to verify the call order without arguments across multiple functions.

```ts
import { mock, spy, callOrderOf } from "testtriple";

const math = mock<Calulator>({
  add: spy(),
  multiply: spy(),
});

math.add(1, 2);
math.multiply(2, 2);
math.add(3, 8);

expect(callOrderOf(math.add, math.multiply)).toStrictEqual([
  math.add,
  math.multiply,
  math.add,
]);
```

### callDetailsOf(fn)

Used to simply verify the number of times a single function was called.

```ts
import { mock, spy, callDetailsOf } from "testtriple";

const math = mock<Calulator>({
  add: spy(),
  multiply: spy(),
});

math.add(1, 2);
math.multiply(2, 2);
math.add(3, 8);

const { called, callCount } = callDetailsOf(math.add);

expect(called).toBe(true);
expect(callCount).toBe(2);
```

## comparison to `testdouble` and `@fluffy-spoon/substitute`

While testtriple was inspired by the mentioned libraries, it does not mean that it focuses on the same core features. Instead, I tried to address some of weaknesses in those libraries. Specifically the creation of nested mocks in one go, without specifying the types for everything, and infer them instead. That's why the quick example features this functionality.

Doing the same in `@fluffy-spoon/substitute` would look like this:

```ts
const bob = Substitute.for<Human>();
const father = Substitute.for<Human>();
const mother = Substitue.for<Human>();
mother.name.returns("helen");
mother.getAge().returns(90);
father.birthDate.returns(new Date(1970, 1, 1));
father.mother.returns(mother);
bob.father.returns(father);
```

While it's technically less lines of code, I find it incredibly hard to read. It gets even harder to read, when the type of sub-objects is not importable. Then it would look like this:

```ts
const bob = Substitute.for<Human>();
const father = Substitute.for<Human["father"]>();
const mother = Substitue.for<Human["father"]["mother"]>();
```

So, constructing such nested mocks is clearly the core feature of testtriple.
Everything else is kept to a minimum, because other libraries already do it very well.

Assertions are a good example of this. Both testtouble and substitute provide some assertion functions, while testtriple does not. testtriple only gives you some functions to access the order and parameters of function calls and it's up to you how you assert that this data is correct. But for most cases, testtriple coupled with an assertion library should be able to do the job very well.

### So when to use what?

- Do you want to conveniently create complex, nested mocks with as readable code as possible? -> testtriple
- Do you want to have some more advanced functionality to verify function calls on mocks? -> testdouble/substitute

In every case you'll need some additional assertion library or assertion tools of your testrunner. With testtriple more that with the others.

## why is it called `testtriple`

I was lazy and just took the word `double` from `testdouble`, and made it `triple` instead. But I'm sure you've already got that :D

## license

MIT
