import Router from "express";
import { register, login, getMe, logout, refreshToken } from "../controllers/authController";
import { protect } from "../middlewares/authMiddleware";
import { validateRequest } from "../middlewares/validationMiddleware";
import { registerSchema, loginSchema } from "../schemas/authSchemas";

const router = Router();

router.post('/register', validateRequest(registerSchema), register);
router.post('/login', validateRequest(loginSchema), login);
router.post('/logout', logout);
router.post('/refresh-token', refreshToken);

router.get('/me', protect, getMe);

export default router;
