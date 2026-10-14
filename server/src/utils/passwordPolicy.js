export const validPassword = (password) =>
  typeof password === "string" && [...password].length >= 8 && [...password].length <= 10;
