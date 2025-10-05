import {Router} from "express";
import {validateRequest} from "../middlewares/validationMiddleware";
import {updateUsernameSchema} from "../schemas/authSchemas";
import {updateUsername} from "../controllers/userController";

const router = Router();

//Al the routes are protected
router.patch('/me', validateRequest(updateUsernameSchema), updateUsername);

export default router;
