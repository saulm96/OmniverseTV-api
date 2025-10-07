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
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendEmailChangeConfirmation,
} from "./emailService";
import crypto from "crypto";
import { Op } from "sequelize";
import { authenticator } from "otplib";
import qrcode from "qrcode";

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
type LoginResult = 
  | { status: '2fa_required'; userId: number }
  | { status: 'success'; accessToken: string; refreshToken: string };

export const loginUser = async (
  credentials: Pick<UserAttributes, "email" | "password_hash">
): Promise<LoginResult> => {  
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

  if (user.is_two_factor_enabled) {
    return {
      status: '2fa_required' as const,  
      userId: user.id,
    };
  }

  const tokens = generateAuthTokens(user);


  return {
    status: 'success' as const,  
    ...tokens
  };
};

export const verifyTwoFactorAuth = async (userId: number, token: string) => {
  const user = await User.findByPk(userId);
  if (!user || !user.is_two_factor_enabled || !user.two_factor_secret) {
      throw new BadRequestError('2FA is not enabled for this user or the user does not exist.');
  }

  const isValid = authenticator.verify({
      token,
      secret: user.two_factor_secret,
  });

  if (!isValid) {
      throw new UnauthorizedError('Invalid 2FA token.');
  }

  // If the token is valid, generate the final session tokens.
  const tokens = generateAuthTokens(user);
  return tokens;
};

export const disableTwoFactorAuth = async (userId: number, password: string) => {
  const user = await User.findByPk(userId);
  if (!user) {
      throw new NotFoundError('User not found.');
  }

  if (!user.is_two_factor_enabled) {
      throw new BadRequestError('2FA is not currently enabled for this account.');
  }

  if (user.auth_provider !== 'local' || !user.password_hash) {
      throw new BadRequestError('Password verification is not possible for this account type.');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
      throw new UnauthorizedError('Incorrect password.');
  }

  // Disable 2FA by clearing the fields
  user.is_two_factor_enabled = false;
  user.two_factor_secret = null;
  user.two_factor_temp_secret = null; // Also clear the temp secret just in case

  await user.save();
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

/**
 * Sets a password for a user that is not a local account and does not have a password.
 * This is used for Google accounts. If they set a password, they can only login with a local account.
 */
export const setPasswordForGoogleAccount = async (
  userId: number,
  newPassword: string
) => {
  const user = await User.findByPk(userId);

  if (!user) {
    throw new NotFoundError("User not found.");
  }

  if (user.auth_provider !== "google" || user.password_hash !== null) {
    throw new BadRequestError(
      "This action is not allowed for this account type."
    );
  }

  user.password_hash = newPassword;
  user.auth_provider = "local";
  user.provider_id = null;
  await user.save();
};

/**
 * Initiates an email change process for a local user.
 */
export const requestEmailChange = async (
  userId: number,
  newEmail: string,
  password: string
) => {
  const user = await User.findByPk(userId);
  if (!user || user.auth_provider !== "local" || !user.password_hash) {
    throw new BadRequestError("This action is not available for this account.");
  }

  // Verify user's current password for security
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new UnauthorizedError("Incorrect password.");
  }

  // Check if the new email is already in use
  const existingUser = await User.findByEmail(newEmail);
  if (existingUser) {
    throw new ConflictError("New email address is already in use.");
  }

  const { token, hashedToken } = generateVerificationToken();

  user.unconfirmed_email = newEmail;
  user.email_change_token = hashedToken;
  user.email_change_token_expires = new Date(Date.now() + 15 * 60 * 1000);
  await user.save();
  await sendEmailChangeConfirmation(newEmail, token);
};

/**
 * Confirms and finalizes an email change.
 */
export const confirmEmailChange = async (token: string) => {
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    where: {
      email_change_token: hashedToken,
      email_change_token_expires: {
        [Op.gt]: new Date(),
      },
    },
  });

  if (!user || !user.unconfirmed_email) {
    throw new BadRequestError("Invalid or expired token.");
  }

  user.email = user.unconfirmed_email;
  user.unconfirmed_email = null;
  user.email_change_token = null;
  user.email_change_token_expires = null;
  user.is_verified = true;

  await user.save();
};

/**
 * Generates a 2FA secret and QR code for the user to scan
 * @param userId The Id of the user
 * @return An object with the secret and the QR code data URL
 */
export const setupTwoFactorAuth = async (userId: number) => {
  const user = await User.findByPk(userId);
  if (!user) throw new NotFoundError("User not found");

  //Generate a new 2fa secret
  const secret = authenticator.generateSecret();
  //Create an otpauth url, the standard format for qr codes
  const otpauth = authenticator.keyuri(user.email, "OmniverseTV", secret);
  //Save the temporary secret to the user`s record
  user.two_factor_temp_secret = secret;
  await user.save();

  //Generate a QR code
  const qrCodeDataUrl = await qrcode.toDataURL(otpauth);
  return{secret, qrCodeDataUrl};
};

/**
 * Enables 2FA for the user
 * @param userId The Id of the user
 * @param token The 2FA token
 */

export const enableTwoFactorAuth = async (userId: number, token: string) => {
    const user = await User.findByPk(userId);
    if (!user || !user.two_factor_temp_secret) {
        throw new BadRequestError('2FA setup was not initiated or has expired.');
    }

    // Verify the token against the temporary secret
    const isValid = authenticator.verify({
        token,
        secret: user.two_factor_temp_secret,
    });

    if (!isValid) {
        throw new BadRequestError('Invalid 2FA token.');
    }

    // If valid, move the secret to the permanent field and enable 2FA
    user.two_factor_secret = user.two_factor_temp_secret;
    user.two_factor_temp_secret = null;
    user.is_two_factor_enabled = true;
    await user.save();
};

