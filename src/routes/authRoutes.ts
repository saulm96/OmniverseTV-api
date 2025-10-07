import Router from "express";
import { register, login, getMe, logout, refreshToken, verifyEmail, googleCallback, forgotPassword, resetPassword, confirmEmailChange } from "../controllers/authController";
import { protect } from "../middlewares/authMiddleware";
import { validateRequest } from "../middlewares/validationMiddleware";
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, confirmEmailChangeSchema } from "../schemas/authSchemas";
import passport from "passport";

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
 * GET /auth/verify-email
 * Verify user email
 */
router.get('/verify-email', verifyEmail); 

// Google OAuth Routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login', session: false }), googleCallback);

// Password Reset Routes
router.post('/forgot-password', validateRequest(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validateRequest(resetPasswordSchema), resetPassword);

// Email Change Routes
router.post('/confirm-email-change', validateRequest(confirmEmailChangeSchema), confirmEmailChange);







/**
 * GET /auth/me
 * Get authenticated user profile
 * @protected Requires valid access token
 */
router.get('/me', protect, getMe);



export default router;