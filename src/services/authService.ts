import { User, UserAuth, RecoveryCode } from "../models";
import type { UserAttributes } from "../models/User";

import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendEmailChangeConfirmation,
} from "./emailService";

import { sequelize } from "../config/database/connection";
import { generateAuthTokens, verifyRefreshToken } from "../utils/jwt";
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  BadRequestError,
} from "../utils/errors";
import { generateVerificationToken } from "../utils/generateToken";
import { generateRecoveryCodes } from "../utils/generateToken";
import { encrypt, decrypt } from "../utils/encryption";

import crypto from "crypto";
import { Op } from "sequelize";
import { authenticator } from "otplib";
import qrcode from "qrcode";
import bcrypt from "bcrypt";

type LocalRegisterProfileData = Pick<
  UserAttributes,
  "username" | "email" | "preferred_language" | "role"
>;
type LocalRegisterAuthData = Pick<UserAuth, "password_hash">;

type LoginResult =
  | { status: "2fa_required"; userId: number }
  | { status: "success"; accessToken: string; refreshToken: string; user: UserAttributes };

/**
 * Verifies a user's email.
 */
export const verifyUserEmail = async (token: string) => {
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const userAuth = await UserAuth.findOne({ where: { verification_token: hashedToken } });

  if (!userAuth) {
    throw new BadRequestError("Invalid or expired verification token.");
  }

  userAuth.is_verified = true;
  userAuth.verification_token = null;
  await userAuth.save();

  return;
};

/**
 * Registers a new user.
 */
export const registerUser = async (profileData: LocalRegisterProfileData, authData: LocalRegisterAuthData) => {
  const { email } = profileData;

  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw new ConflictError('User already exists');
  }

  const t = await sequelize.transaction();
  try {
    const newUser = await User.create(profileData, { transaction: t });

    await UserAuth.create({
      ...authData,
      user_id: newUser.id,
      auth_provider: 'local',
      is_verified: false,
      is_two_factor_enabled: false,
    }, { transaction: t });
    
    const { token, hashedToken } = generateVerificationToken();
    const userAuth = await UserAuth.findOne({where: {user_id: newUser.id}, transaction: t});
    if(userAuth) {
        userAuth.verification_token = hashedToken;
        await userAuth.save({ transaction: t });
    }
    
    await t.commit();
    
    await sendVerificationEmail(newUser.email, token);

    return {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
    };
  } catch (error) {
    await t.rollback();
    console.error('Failed to register user:', error);
    throw error;
  }
};

/**
 * Logs in a user.
 */
export const loginUser = async (
  credentials: { email: string; password_hash: string | null }
): Promise<LoginResult> => {
  const { email, password_hash: password } = credentials;

  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new NotFoundError("User not found.");
  }

  const userAuth = await UserAuth.findOne({ where: { user_id: user.id } });
  if (!userAuth || userAuth.auth_provider !== 'local' || !userAuth.password_hash) {
    throw new UnauthorizedError('Invalid credentials.');
  }
  if (!userAuth.is_verified) {
    try {
      const { token, hashedToken } = generateVerificationToken();
      userAuth.verification_token = hashedToken;
      await userAuth.save();
      // Usamos el email del perfil de usuario para enviar el correo
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
  const isMatch = await userAuth.comparePassword(password);
  if (!isMatch) {
    throw new UnauthorizedError("Invalid credentials.");
  }

  if (userAuth.is_two_factor_enabled) {
    return {
      status: '2fa_required' as const,
      userId: user.id,
    };
  }

  const tokens = generateAuthTokens(user);
  return {
    status: 'success' as const,
    ...tokens,
    user: user.get({plain: true})
  };
};

export const verifyTwoFactorAuth = async (userId: number, token: string) => {
  const userAuth = await UserAuth.findByPk(userId);
  if (!userAuth || !userAuth.is_two_factor_enabled || !userAuth.two_factor_secret) {
    throw new BadRequestError(
      "2FA is not enabled for this user or the user does not exist."
    );
  }
  const decryptedSecret = decrypt(userAuth.two_factor_secret);
  const isValid = authenticator.verify({
    token,
    secret: decryptedSecret,
  });

  if (!isValid) {
    throw new UnauthorizedError("Invalid 2FA token.");
  }

  const user = await User.findByPk(userId);
  if (!user) {
    throw new UnauthorizedError("User for this token no longer exists.");
  }
  // If the token is valid, generate the final session tokens.
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
  const user = await User.findOne({ where: { email } });
  if (!user) return; 

  const userAuth = await UserAuth.findOne({ where: { user_id: user.id } });
  if (!userAuth || userAuth.auth_provider !== "local") return;

  const { token, hashedToken } = generateVerificationToken();
  userAuth.password_reset_token = hashedToken;
  userAuth.password_reset_token_expires = new Date(Date.now() + 10 * 60 * 1000);
  await userAuth.save();
  await sendPasswordResetEmail(user.email, token);
};

/**
 * Resets a user's password using a valid token.
 */
export const resetPassword = async (token: string, newPassword: string) => {
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const userAuth = await UserAuth.findOne({
    where: {
      password_reset_token: hashedToken,
      password_reset_token_expires: { [Op.gt]: new Date() },
    },
  });
  if (!userAuth) throw new BadRequestError("Token is invalid or has expired.");

  userAuth.password_hash = newPassword;
  userAuth.password_reset_token = null;
  userAuth.password_reset_token_expires = null;
  await userAuth.save();
};

/**
 * Changes a user's password.
 */
export const changePassword = async (userId: number, currentPassword: string, newPassword: string, twoFactorToken?: string) => {
  const userAuth = await UserAuth.findOne({ where: { user_id: userId } });
  if (!userAuth || userAuth.auth_provider !== 'local' || !userAuth.password_hash) {
    throw new BadRequestError('Password cannot be changed for this account type.');
  }

  if (userAuth.is_two_factor_enabled) {
      if (!twoFactorToken || !userAuth.two_factor_secret) throw new UnauthorizedError('2FA token is required.');
      const decryptedSecret = decrypt(userAuth.two_factor_secret);
      const isValid = authenticator.verify({ token: twoFactorToken, secret: decryptedSecret });
      if (!isValid) throw new UnauthorizedError('Invalid 2FA token.');
  }

  const isMatch = await userAuth.comparePassword(currentPassword);
  if (!isMatch) throw new UnauthorizedError('Incorrect current password.');

  userAuth.password_hash = newPassword;
  await userAuth.save();
};

/**
 * Sets a password for a user that is not a local account and does not have a password.
 * This is used for Google accounts. If they set a password, they can only login with a local account.
 */
export const setPasswordForGoogleUser = async (userId: number, newPassword: string) => {
  const userAuth = await UserAuth.findOne({ where: { user_id: userId } });
  if (!userAuth || userAuth.auth_provider !== 'google' || userAuth.password_hash !== null) {
      throw new BadRequestError('This action is not applicable for this account type.');
  }
  userAuth.password_hash = newPassword;
  userAuth.auth_provider = 'local';
  userAuth.provider_id = null;
  await userAuth.save();
};

/**
 * Initiates an email change process for a local user.
 */
export const requestEmailChange = async (userId: number, newEmail: string, password: string) => {
  const userAuth = await UserAuth.findOne({ where: { user_id: userId } });
  if (!userAuth || userAuth.auth_provider !== "local" || !userAuth.password_hash) {
    throw new BadRequestError("This action is not available for this account.");
  }
  const isMatch = await userAuth.comparePassword(password);
  if (!isMatch) throw new UnauthorizedError("Incorrect password.");

  const existingUser = await User.findOne({ where: { email: newEmail } });
  if (existingUser) throw new ConflictError("New email address is already in use.");

  const { token, hashedToken } = generateVerificationToken();
  userAuth.unconfirmed_email = newEmail;
  userAuth.email_change_token = hashedToken;
  userAuth.email_change_token_expires = new Date(Date.now() + 15 * 60 * 1000);
  await userAuth.save();
  await sendEmailChangeConfirmation(newEmail, token);
};
/**
 * Confirms and finalizes an email change.
 */
export const confirmEmailChange = async (token: string) => {
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const t = await sequelize.transaction();
  try {
    const userAuth = await UserAuth.findOne({
        where: {
            email_change_token: hashedToken,
            email_change_token_expires: { [Op.gt]: new Date() },
        },
        transaction: t,
    });
    if (!userAuth || !userAuth.unconfirmed_email) {
        throw new BadRequestError("Invalid or expired token.");
    }

    const user = await User.findByPk(userAuth.user_id, { transaction: t });
    if (!user) throw new NotFoundError("Associated user profile not found.");

    user.email = userAuth.unconfirmed_email;
    userAuth.unconfirmed_email = null;
    userAuth.email_change_token = null;
    userAuth.email_change_token_expires = null;
    userAuth.is_verified = true;

    await user.save({ transaction: t });
    await userAuth.save({ transaction: t });
    await t.commit();
  } catch(error) {
    await t.rollback();
    throw error;
  }
};

/**
 * Generates a 2FA secret and QR code for the user to scan
 * @param userId The Id of the user
 * @return An object with the secret and the QR code data URL
 */
export const setupTwoFactorAuth = async (userId: number) => {
  const userAuth = await UserAuth.findOne({ where: { user_id: userId }, include: { model: User, as: 'user' } });
  if (!userAuth || !userAuth.user) throw new NotFoundError("User not found");
  
  const secret = authenticator.generateSecret();
  const otpauth = authenticator.keyuri(userAuth.user.email, "OmniverseTV", secret);
  
  userAuth.two_factor_temp_secret = secret;
  await userAuth.save();

  const qrCodeDataUrl = await qrcode.toDataURL(otpauth);
  return { secret, qrCodeDataUrl };
};

/**
 * Enables 2FA for the user
 */
export const enableTwoFactorAuth = async (userId: number, token: string) => {
  const userAuth = await UserAuth.findOne({ where: { user_id: userId } });
  if (!userAuth || !userAuth.two_factor_temp_secret) {
    throw new BadRequestError("2FA setup was not initiated or has expired.");
  }
  const isValid = authenticator.verify({ token, secret: userAuth.two_factor_temp_secret });
  if (!isValid) throw new BadRequestError("Invalid 2FA token.");
  
  const plaintextRecoveryCodes = generateRecoveryCodes();
  const hashedRecoveryCodes = await Promise.all(
    plaintextRecoveryCodes.map((code) => bcrypt.hash(code, 10))
  );

  await RecoveryCode.destroy({ where: { user_id: userId } });
  const codesToInsert = hashedRecoveryCodes.map((hashedCode) => ({ code: hashedCode, user_id: userId, is_used: false }));
  await RecoveryCode.bulkCreate(codesToInsert);

  userAuth.two_factor_secret = encrypt(userAuth.two_factor_temp_secret!);
  userAuth.two_factor_temp_secret = null;
  userAuth.is_two_factor_enabled = true;
  await userAuth.save();
  return { recoveryCodes: plaintextRecoveryCodes };
};

export const disableTwoFactorAuth = async (userId: number, password: string) => {
  const userAuth = await UserAuth.findOne({ where: { user_id: userId } });
  if (!userAuth) throw new NotFoundError("User auth record not found.");
  if (!userAuth.is_two_factor_enabled) throw new BadRequestError("2FA is not currently enabled.");
  if (userAuth.auth_provider !== "local" || !userAuth.password_hash) {
    throw new BadRequestError("Password verification is not possible.");
  }
  const isMatch = await userAuth.comparePassword(password);
  if (!isMatch) throw new UnauthorizedError("Incorrect password.");

  userAuth.is_two_factor_enabled = false;
  userAuth.two_factor_secret = null;
  userAuth.two_factor_temp_secret = null; 
  await userAuth.save();
};

/**
 * Allows a user to log in using a 2FA recovery code.
 * On success, it grants a session and disables 2FA for security.
 * @param email The user's email.
 * @param recoveryCode The plaintext recovery code provided by the user.
 * @returns An object containing the accessToken and refreshToken.
 */
export const recoverTwoFactorAuth = async (email: string, recoveryCode: string) => {
  const user = await User.findOne({ where: { email } });
  if (!user) throw new UnauthorizedError("Invalid recovery code.");
  
  const userAuth = await UserAuth.findOne({ where: { user_id: user.id } });
  if (!userAuth || !userAuth.is_two_factor_enabled) throw new UnauthorizedError("Invalid recovery code or 2FA not enabled.");

  const availableCodes = await RecoveryCode.findAll({ where: { user_id: user.id, is_used: false } });
  let matchedCode: RecoveryCode | null = null;
  for (const dbCode of availableCodes) {
    if (await bcrypt.compare(recoveryCode, dbCode.code)) {
        matchedCode = dbCode;
        break;
    }
  }
  if (!matchedCode) throw new UnauthorizedError("Invalid recovery code.");
  
  matchedCode.is_used = true;
  await matchedCode.save();

  userAuth.is_two_factor_enabled = false;
  userAuth.two_factor_secret = null;
  await userAuth.save();

  const tokens = generateAuthTokens(user);
  return tokens;
};