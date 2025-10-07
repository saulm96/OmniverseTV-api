import { Request, Response, NextFunction } from "express";
import * as userService from "../services/userService";
import * as authService from "../services/authService";
import { User as UserModel } from "../models";
import { BadRequestError } from "../utils/errors";

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
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

export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
      const user = req.user as UserModel;
      const userId = user.id;
      const { currentPassword, newPassword } = req.body;

      await authService.changePassword(userId, currentPassword, newPassword);

      res.status(200).json({ message: 'Password changed successfully!' });
  } catch (error) {
      next(error);
  }
};

export const setPasswordForGoogleAccount = async (req: Request, res: Response, next: NextFunction) => {
  try {
      const user = req.user as UserModel;
      const userId = user.id;
      const { password } = req.body;

      await authService.setPasswordForGoogleAccount(userId, password);

      res.status(200).json({ message: 'Password set successfully!' });
  } catch (error) {
      next(error);
  }
};

export const requestEmailChange = async (req: Request, res: Response, next: NextFunction) => {
  try {
      const user = req.user as UserModel;
      const userId = user.id;
      const { newEmail, password } = req.body;

      await authService.requestEmailChange(userId, newEmail, password);

      res.status(200).json({ message: 'Email change request processed successfully!' });
  } catch (error) {
      next(error);
  }
};