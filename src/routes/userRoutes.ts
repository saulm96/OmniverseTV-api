import {Router} from "express";
import {validateRequest} from "../middlewares/validationMiddleware";
import {updateProfileSchema, changePasswordSchema} from "../schemas/authSchemas";
import {updateProfile, changePassword, uploadProfileImage} from "../controllers/userController";
import {upload} from "../middlewares/uploadMiddleware"
const router = Router();

//Al the routes are protected
router.patch('/me', validateRequest(updateProfileSchema), updateProfile);
router.post('/me/avatar', upload.single('avatar'), uploadProfileImage);

router.post('/me/change-password', validateRequest(changePasswordSchema), changePassword);
export default router;
