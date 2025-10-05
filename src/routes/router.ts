import {protect} from "../middlewares/authMiddleware";
import authRoutes from "./authRoutes";
import packageRoutes from "./packageRoutes";
import subscriptionRoutes from "./subscriptionRoutes";
import channelRoutes from "./channelRoutes";
import userRoutes from "./userRoutes";

import Router from "express";

const router = Router();

router.use('/auth', authRoutes);
router.use('/packages', packageRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/channels', channelRoutes);
router.use('/users', protect, userRoutes);

export default router;
