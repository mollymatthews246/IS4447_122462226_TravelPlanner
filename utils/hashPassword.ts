import * as Crypto from 'expo-crypto';

const SALT = 'trip-planner-app-salt';

export async function hashPassword(password: string) {
  const hashedPassword = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    password + SALT
  );

  return hashedPassword;
}