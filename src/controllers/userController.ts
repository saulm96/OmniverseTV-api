import { Request, Response, NextFunction } from "express";
import * as userService from "../services/userService";
import * as authService from "../services/authService";
import { User as UserModel } from "../models";
import { BadRequestError } from "../utils/errors";

export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user as UserModel;
    const userId = user.id;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const updatedUser = await userService.updateProfile(userId, req.body);
    res.status(200).json({
      message: "Profile updated successfully!",
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

export const uploadProfileImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.file) {
      throw new BadRequestError("No file uploaded");
    }

    const user = req.user as UserModel;
    const userId = user.id;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const updateUser = await userService.uploadProfileImage(
      userId,
      req.file.buffer
    );

    res.status(200).json({
      message: "Profile image updated successfully!",
      user: updateUser,
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user as UserModel;
    const userId = user.id;
    const { currentPassword, newPassword, twoFactorToken } = req.body;

    await authService.changePassword(userId, currentPassword, newPassword, twoFactorToken);

    res.status(200).json({ message: "Password changed successfully!" });
  } catch (error) {
    next(error);
  }
};

export const setPasswordForGoogleAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user as UserModel;
    const userId = user.id;
    const { password } = req.body;

    await authService.setPasswordForGoogleAccount(userId, password);

    res.status(200).json({ message: "Password set successfully!" });
  } catch (error) {
    next(error);
  }
};

export const requestEmailChange = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user as UserModel;
    const userId = user.id;
    const { newEmail, password } = req.body;

    await authService.requestEmailChange(userId, newEmail, password);

    res
      .status(200)
      .json({ message: "Email change request processed successfully!" });
  } catch (error) {
    next(error);
  }
};

export const deleteAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user as UserModel;
    const userId = user.id;
    const { password } = req.body;

    await userService.deleteAccount(userId, password);
    //Logout the user by clearing the session cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 0,
    };
    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);

    res.status(200).json({ message: "Account deleted successfully!" });
  } catch (error) {
    next(error);
  }
};

export const setupTwoFactorAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user as UserModel;
    const userId = user.id;
    const { secret, qrCodeDataUrl } = await authService.setupTwoFactorAuth(
      userId
    );
    res.status(200).json({
      message:
        "Scan the QR code with your authenticator app or enter the secret manually",
      secret,
      qrCode: qrCodeDataUrl,
    });
  } catch (error) {
    next(error);
  }
};

export const enableTwoFactorAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user as UserModel;
    const userId = user.id;
    const { token } = req.body;

    const { recoveryCodes } = await authService.enableTwoFactorAuth(
      userId,
      token
    );

    res.status(200).json({
      message:
        "2FA has been enabled successfully! Please save these recovery codes in a safe place.",
      recoveryCodes,
    });
  } catch (error) {
    next(error);
  }
};

export const disableTwoFactorAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user as UserModel;
    const userId = user.id;
    const { password } = req.body;

    await authService.disableTwoFactorAuth(userId, password);

    res.status(200).json({ message: "2FA has been disabled successfully." });
  } catch (error) {
    next(error);
  }
};
