import authRoutes from "./authRoutes";
import Router from "express";

const router = Router();

router.use('/auth', authRoutes);

export default router;
