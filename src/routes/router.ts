import authRoutes from "./authRoutes";
import packageRoutes from "./packageRoutes";

import Router from "express";

const router = Router();

router.use('/auth', authRoutes);
router.use('/packages', packageRoutes);

export default router;
