import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

export const hashPassword = async (plaintextPassword) => {
  return bcrypt.hash(plaintextPassword, SALT_ROUNDS);
};

export const comparePassword = async (plaintextPassword, passwordHash) => {
  return bcrypt.compare(plaintextPassword, passwordHash);
};
