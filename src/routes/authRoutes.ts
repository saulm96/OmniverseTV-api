import Router from "express";
import { register, login, getMe, logout, refreshToken } from "../controllers/authController";
import { protect } from "../middlewares/authMiddleware";
import { validateRequest } from "../middlewares/validationMiddleware";
import { registerSchema, loginSchema } from "../schemas/authSchemas";

/**
 * Authentication router
 * 
 * Handles user authentication endpoints including registration,
 * login, logout, token refresh, and profile access.
 * 
 * @remarks
 * All routes except `/me` are public. The `/me` endpoint requires
 * authentication via the `protect` middleware.
 */
const router = Router();

/**
 * POST /auth/register
 * Register a new user account
 */
router.post('/register', validateRequest(registerSchema), register);

/**
 * POST /auth/login
 * Authenticate user and receive access token
 */
router.post('/login', validateRequest(loginSchema), login);

/**
 * POST /auth/logout
 * Invalidate user session
 */
router.post('/logout', logout);

/**
 * POST /auth/refresh-token
 * Refresh expired access token
 */
router.post('/refresh-token', refreshToken);

/**
 * GET /auth/me
 * Get authenticated user profile
 * @protected Requires valid access token
 */
router.get('/me', protect, getMe);

export default router;