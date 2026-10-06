/*
|--------------------------------------------------
| npm imports
|--------------------------------------------------
*/
import bcrypt from "bcryptjs";

/*
|--------------------------------------------------
| constants
|--------------------------------------------------
*/
const SALT_ROUNDS = 10;

/*
|----------------------------------------------------------------------------------------------------
| hashPassword
|----------------------------------------------------------------------------------------------------
| Hashes a plaintext password securely using bcryptjs with configured salt rounds.
*/
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/*
|----------------------------------------------------------------------------------------------------
| verifyPassword
|----------------------------------------------------------------------------------------------------
| Compares a plaintext password against a stored bcrypt hash in constant time.
*/
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
