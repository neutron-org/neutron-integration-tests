export const wait = async (n: number) =>
  new Promise((r) => {
    setTimeout(() => r(true), n);
  });
