import {Router} from "express";
import {validateRequest} from "../middlewares/validationMiddleware";
import {updateUsernameSchema} from "../schemas/authSchemas";
import {updateUsername} from "../controllers/userController";
import {uploadProfileImage} from "../controllers/userController";
import {upload} from "../middlewares/uploadMiddleware"
const router = Router();

//Al the routes are protected
router.patch('/me', validateRequest(updateUsernameSchema), updateUsername);
router.post('/me/avatar', upload.single('avatar'), uploadProfileImage);

export default router;
