import crypto from 'crypto';

/**
 * Generates a random verification token and its hashed version.
 * @returns An object containing the plaintext token and its SHA256 hash.
 */
export const generateVerificationToken = () => {

  const token = crypto.randomBytes(32).toString('hex');

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  return { token, hashedToken };
};