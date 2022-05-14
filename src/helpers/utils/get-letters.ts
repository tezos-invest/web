export const getLetters = (value: string) => {
  const matches = value.match(/\b(\w)/g); // ['J','S','O','N']
  return matches ? matches.join("") : value[0];
};
