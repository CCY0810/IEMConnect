import bcrypt from 'bcryptjs';

export const generateTwoFACode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const hashTwoFACode = async (code) => {
  return await bcrypt.hash(code, 10);
};

export const verifyTwoFACode = async (code, hash) => {
  return await bcrypt.compare(code, hash);
};

export const isTwoFACodeExpired = (expiryDate) => {
  return new Date() > new Date(expiryDate);
};