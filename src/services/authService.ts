import { User } from "../models";
import type { UserAttributes } from "../models/User";
import { generateAuthTokens, verifyRefreshToken } from "../utils/jwt";
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  BadRequestError,
} from "../utils/errors";
import { sendVerificationEmail } from "./emailService";
import { generateVerificationToken } from "../utils/generateToken";
import crypto from 'crypto';

type LocalRegisterData = Pick<
  UserAttributes,
  "username" | "email" | "password_hash" | "preferred_language"
>;

export const verifyUserEmail = async (token: string) => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({ where: { verification_token: hashedToken } });

  if (!user) {
    throw new BadRequestError('Invalid or expired verification token.');
  }

  user.is_verified = true;
  user.verification_token = null;
  await user.save();

  return;
};

export const registerUser = async (userData: LocalRegisterData) => {
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
    auth_provider: "local",
    is_verified: false,
  });

  try {
    const { token, hashedToken } = generateVerificationToken();

    newUser.verification_token = hashedToken;
    await newUser.save();

    await sendVerificationEmail(newUser.email, token);
  } catch (error) {
    console.error(
      `Failed to send verification email for user ${newUser.email}:`,
      error
    );
  }

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
  
  if (user.auth_provider === 'local' && !user.is_verified) {
    try {
        const { token, hashedToken } = generateVerificationToken();
        user.verification_token = hashedToken;
        await user.save();
        await sendVerificationEmail(user.email, token);
    } catch (error) {
        console.error(`Failed to re-send verification email for ${user.email}`, error);
    }
    throw new UnauthorizedError("Your account is not verified. We have sent you a new verification email.");
  }

  if (!password) {
    throw new UnauthorizedError("Invalid credentials.");
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new UnauthorizedError("Invalid credentials.");
  }

  const tokens = generateAuthTokens(user);

  return tokens;
};

export const refreshUserSession = async (token: string) => {
  if (!token) {
    throw new UnauthorizedError("No refresh token provided.");
  }

  // 1. Verify the refresh token
  const decoded = verifyRefreshToken(token);
  if (!decoded.userId) {
    throw new UnauthorizedError("Invalid refresh token.");
  }

  // 2. Find the user associated with the token
  const user = await User.findByPk(decoded.userId);
  if (!user) {
    throw new UnauthorizedError("User for this token no longer exists.");
  }

  // 3. Generate a new access token
  const { accessToken: newAccessToken } = generateAuthTokens(user);

  return { newAccessToken };
};

