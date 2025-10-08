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

export const generateRecoveryCodes = (): string[] => {
  const codes: string[] = [];
  for(let i= 0; i < 10; i++){
    const random = crypto.randomBytes(4).readUInt32BE(0);
    const code = (random % 1000000).toString().padStart(8, '0');
    const formattedCode = `${code.slice(0, 4)}-${code.slice(4)}`
    codes.push(formattedCode);
  }
  return codes;
}