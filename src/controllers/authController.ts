import { Request, Response, NextFunction } from "express";
import * as authService from "../services/authService";
import { BadRequestError } from "../utils/errors";
import { generateAuthTokens } from "../utils/jwt";
import { User } from "../models";

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
      message: "User registered succesfully! Please check your email to verify your account.", 
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

    const result = await authService.loginUser({
      email,
      password_hash: password,
    });

    if (result.status === '2fa_required') {
      return res.status(200).json({
        message: '2FA token required.',
        userId: result.userId,
      });
    } else {
      const { accessToken, refreshToken } = result;

      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 15 * 60 * 1000,
      });

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({ message: "Login successful!" });
    }
  } catch (error) {
    next(error);
  }
};

export const verifyTwoFactorAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {userId, token} = req.body;
    const {accessToken, refreshToken} = await authService.verifyTwoFactorAuth(userId, token);
    
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ message: "Login succesful!" });
  } catch (error) {
    next(error);
  }
};

export const logout = (req: Request, res: Response) => {
  // Clear the cookies by setting an expired date
  const cookiesOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge:0
  };
  
  res.clearCookie("accessToken", cookiesOptions);
  res.clearCookie("refreshToken", cookiesOptions);

  res.status(200).json({ message: "Logged out successfully" });
};

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { refreshToken: token } = req.cookies;
    const { newAccessToken } = await authService.refreshUserSession(token);

    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.status(200).json({ message: 'Access token refreshed successfully.' });
  } catch (error) {
    next(error);
  }
};


export const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      throw new BadRequestError('Verification token is missing or invalid.');
    }

    await authService.verifyUserEmail(token);

    // En una aplicación real, aquí redirigirías al frontend
    // res.redirect('http://tu-frontend.com/login?verified=true');
    res.status(200).json({ message: "Email verified successfully. You can now log in." });
  } catch (error) {
    next(error);
  }
};

export const googleCallback = (req: Request, res: Response) => {
  const user = req.user as User;

  const { accessToken, refreshToken } = generateAuthTokens(user);
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 15 * 60 * 1000,
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  
  res.redirect('http://localhost:3001/dashboard');
};


export const getMe = (req: Request, res: Response) => {
  // The user object is attached to the request by the 'protect' middleware
  res.status(200).json({
    status: "success",
    data: {
      user: req.user,
    },
  });
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
      await authService.forgotPassword(req.body.email);
      res.status(200).json({ message: 'A password reset link has been sent.' });
  } catch (error) {
      next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
      const { token, password } = req.body;
      await authService.resetPassword(token, password);
      res.status(200).json({ message: 'Password has been reset successfully.' });
  } catch (error) {
      next(error);
  }
};

export const confirmEmailChange = async (req: Request, res: Response, next: NextFunction) => {
  try {
      const { token } = req.body;

      await authService.confirmEmailChange(token);

      res.status(200).json({ message: 'Email changed successfully!' });
  } catch (error) {
      next(error);
  }
};