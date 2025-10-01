import bcrypt from "bcrypt";
import { User } from "../models";
import type { UserAttributes } from "../models/User";
import { generateAuthTokens, verifyRefreshToken } from "../utils/jwt";
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from "../utils/errors";

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
 * Refreshes a user's session by generating a new access token.
 * @param token The refresh token from the user's cookie.
 * @returns A new access token.
 */
export const refreshUserSession = async (token: string) => {
  if (!token) {
      throw new UnauthorizedError('No refresh token provided.');
  }

  // 1. Verify the refresh token
  const decoded = verifyRefreshToken(token);
  if (!decoded.userId) {
      throw new UnauthorizedError('Invalid refresh token.');
  }

  // 2. Find the user associated with the token
  const user = await User.findByPk(decoded.userId);
  if (!user) {
      throw new UnauthorizedError('User for this token no longer exists.');
  }

  // 3. Generate a new access token
  const { accessToken: newAccessToken } = generateAuthTokens(user);

  return { newAccessToken };
}