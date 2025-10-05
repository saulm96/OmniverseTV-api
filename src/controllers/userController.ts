import { Request, Response, NextFunction } from "express";
import * as userService from '../services/userService';
import { User as UserModel } from '../models';

/**
 * Handles the request to update the current user's username.
 */
export const updateUsername = async (req: Request, res: Response, next: NextFunction) => {
  try {
    
    const user = req.user as UserModel;
    const userId = user.id;

    if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
    }

    const { username: newUsername } = req.body;
    const updatedUser = await userService.updateUsername(userId, newUsername);

    res.status(200).json({
      message: 'Username updated successfully!',
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};