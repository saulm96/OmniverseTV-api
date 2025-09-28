import authRoutes from "./authRoutes";
import packageRoutes from "./packageRoutes";
import subscriptionRoutes from "./subscriptionRoutes";

import Router from "express";

const router = Router();

router.use('/auth', authRoutes);
router.use('/packages', packageRoutes);
router.use('/subscriptions', subscriptionRoutes);

export default router;
