import bcrypt from "bcrypt";
import { User } from "../models";
import type { UserAttributes } from "../models/User";
import { generateAuthTokens, verifyRefreshToken } from "../utils/jwt";
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from "../utils/errors";

/**
 * Registers a new user in the system
 * 
 * @param userData - User data excluding the auto-generated id
 * @returns Sanitized user object without sensitive data
 * @throws {ConflictError} If email already exists
 * 
 * @example
 * ```typescript
 * const user = await registerUser({
 *   username: 'johndoe',
 *   email: 'john@example.com',
 *   password_hash: 'plainPassword123',
 *   preferred_language: 'en'
 * });
 * ```
 */
export const registerUser = async (userData: Omit<UserAttributes, "id">) => {
  const { username, email, password_hash, preferred_language } = userData;

  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    throw new ConflictError("User already exists");
  }

  const newUser = await User.create({
    username,
    email,
    password_hash,
    preferred_language,
  });
  
  return {
    id: newUser.id,
    username: newUser.username,
    email: newUser.email,
    preferred_language: newUser.preferred_language,
  };
};

/**
 * Authenticates a user and generates JWT tokens
 * 
 * @param credentials - User email and password
 * @returns Object containing access and refresh tokens
 * @throws {NotFoundError} If user doesn't exist
 * @throws {UnauthorizedError} If password is incorrect
 * 
 * @example
 * ```typescript
 * const tokens = await loginUser({
 *   email: 'john@example.com',
 *   password_hash: 'plainPassword123'
 * });
 * ```
 */
export const loginUser = async (
  credentials: Pick<UserAttributes, "email" | "password_hash">
) => {
  const { email, password_hash: password } = credentials;

  const user = await User.findByEmail(email);
  if (!user) {
    throw new NotFoundError("User not found.");
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new UnauthorizedError("Invalid credentials.");
  }

  const tokens = generateAuthTokens(user);

  return tokens;
};

/**
 * Refreshes a user's session by generating a new access token
 * 
 * @param token - The refresh token from the user's cookie
 * @returns Object containing the new access token
 * @throws {UnauthorizedError} If token is missing, invalid, or user doesn't exist
 * 
 * @example
 * ```typescript
 * const { newAccessToken } = await refreshUserSession(refreshToken);
 * ```
 */
export const refreshUserSession = async (token: string) => {
  if (!token) {
    throw new UnauthorizedError('No refresh token provided.');
  }

  const decoded = verifyRefreshToken(token);
  if (!decoded.userId) {
    throw new UnauthorizedError('Invalid refresh token.');
  }

  const user = await User.findByPk(decoded.userId);
  if (!user) {
    throw new UnauthorizedError('User for this token no longer exists.');
  }

  const { accessToken: newAccessToken } = generateAuthTokens(user);

  return { newAccessToken };
};