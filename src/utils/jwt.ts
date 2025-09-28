import 'dotenv/config';
import jwt from "jsonwebtoken";
import {User} from "../models";

export const generateAuthTokens = (user: User) => {
  // Access token (short-lived)
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_ACCESS_SECRET!,
    { expiresIn: '15m' }
  );

  // Refresh token (long-lived)
  const refreshToken = jwt.sign(
    { userId: user.id },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: '1d' }
  );

  return { accessToken, refreshToken };
};
