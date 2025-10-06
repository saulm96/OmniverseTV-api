import { User } from "../models";
import type { UserAttributes } from "../models/User";
import { generateAuthTokens, verifyRefreshToken } from "../utils/jwt";
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  BadRequestError,
} from "../utils/errors";
import { generateVerificationToken } from "../utils/generateToken";
import { sendVerificationEmail, sendPasswordResetEmail } from "./emailService";
import crypto from "crypto";
import { Op } from "sequelize";

type LocalRegisterData = Pick<
  UserAttributes,
  "username" | "email" | "password_hash" | "preferred_language"
>;

/**
 * Verifies a user's email.
 */
export const verifyUserEmail = async (token: string) => {
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    where: { verification_token: hashedToken },
  });

  if (!user) {
    throw new BadRequestError("Invalid or expired verification token.");
  }

  user.is_verified = true;
  user.verification_token = null;
  await user.save();

  return;
};

/**
 * Registers a new user.
 */
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
    role: "user",
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

/**
 * Logs in a user.
 */
export const loginUser = async (
  credentials: Pick<UserAttributes, "email" | "password_hash">
) => {
  const { email, password_hash: password } = credentials;

  const user = await User.findByEmail(email);
  if (!user) {
    throw new NotFoundError("User not found.");
  }

  if (user.auth_provider === "local" && !user.is_verified) {
    try {
      const { token, hashedToken } = generateVerificationToken();
      user.verification_token = hashedToken;
      await user.save();
      await sendVerificationEmail(user.email, token);
    } catch (error) {
      console.error(
        `Failed to re-send verification email for ${user.email}`,
        error
      );
    }
    throw new UnauthorizedError(
      "Your account is not verified. We have sent you a new verification email."
    );
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

/**
 * Refreshes a user's session.
 */
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

/**
 * Sends a password reset email to the user.
 */
export const forgotPassword = async (email: string) => {
  const user = await User.findByEmail(email);

  // Silently succeed even if user doesn't exist to prevent email enumeration attacks
  if (!user || user.auth_provider !== "local") {
    console.log(
      `Password reset requested for non-local or non-existent user: ${email}`
    );
    return;
  }

  const { token, hashedToken } = generateVerificationToken();

  user.password_reset_token = hashedToken;
  // Set token to expire in 10 minutes
  user.password_reset_token_expires = new Date(Date.now() + 10 * 60 * 1000);

  await user.save();
  await sendPasswordResetEmail(user.email, token);
};

/**
 * Resets a user's password using a valid token.
 */
export const resetPassword = async (token: string, newPassword: string) => {
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    where: {
      password_reset_token: hashedToken,
      // Check if the token has expired
      password_reset_token_expires: {
        [Op.gt]: new Date(),
      },
    },
  });

  if (
    !user ||
    !user.password_reset_token_expires ||
    user.password_reset_token_expires < new Date()
  ) {
    throw new BadRequestError("Token is invalid or has expired.");
  }

  // The 'beforeUpdate' hook in the User model will automatically hash the new password
  user.password_hash = newPassword;
  user.password_reset_token = null;
  user.password_reset_token_expires = null;

  await user.save();
};

/**
 * Changes a user's password.
 */
export const changePassword = async (
  userId: number,
  currentPassword: string,
  newPassword: string
) => {
  const user = await User.findByPk(userId);

  if (!user) {
    throw new NotFoundError("User not found.");
  }

  if (user.auth_provider !== "local" || !user.password_hash) {
    throw new BadRequestError(
      "Password cannot be changed for this account type."
    );
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new UnauthorizedError("Incorrect current password.");
  }

  user.password_hash = newPassword;
  await user.save();
};
