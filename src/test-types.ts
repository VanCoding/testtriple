export type Human = {
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
