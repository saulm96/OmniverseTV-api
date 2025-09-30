import Router from "express";
import {getChannelById} from "../controllers/channelController";

const router = Router();

router.get("/:id", getChannelById);

export default router;
