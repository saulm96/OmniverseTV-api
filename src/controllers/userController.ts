import { Request, Response, NextFunction } from "express";
import * as userService from "../services/userService";
import { User as UserModel } from "../models";
import { BadRequestError } from "../utils/errors";

/**
 * Handles the request to update the current user's username.
 */
export const updateUsername = async (
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

    const { username: newUsername } = req.body;
    const updatedUser = await userService.updateUsername(userId, newUsername);

    res.status(200).json({
      message: "Username updated successfully!",
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
