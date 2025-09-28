import Router from "express";
import { register, login, getMe, logout, refreshToken } from "../controllers/authController";
import { protect } from "../middlewares/authMiddleware";

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh-token', refreshToken);

router.get('/me', protect, getMe);

export default router;
