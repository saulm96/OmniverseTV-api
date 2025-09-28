import { Request, Response, NextFunction } from "express";


import * as authService from "../services/authService";
import { BadRequestError } from "../utils/errors";

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { username, email, password, preferred_language } = req.body;

    if (!username || !email || !password || !preferred_language) {
      throw new BadRequestError("Missing required fields");
    }

    const newUser = await authService.registerUser({
      username,
      email,
      password_hash: password,
      preferred_language,
    });

    res.status(201).json({
      message: "User registered succesfully!",
      user: newUser,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new BadRequestError("Email and password are required.");
    }

    const { accessToken, refreshToken } = await authService.loginUser({
      email,
      password_hash: password,
    });

    // Set cookies
    res.cookie("accessToken", accessToken, {
      httpOnly: true, // The cookie is not accessible via JavaScript
      secure: process.env.NODE_ENV === "production", // Only send over HTTPS in production
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      message: "Login successful!",
    });
  } catch (error) {
    next(error);
  }
};

//CONTROLLER TO TEST THE MIDDLEWARES
export const getMe = (req: Request, res: Response) => {
  // The user object is attached to the request by the 'protect' middleware
  res.status(200).json({
    status: "success",
    data: {
      user: req.user,
    },
  });
};
