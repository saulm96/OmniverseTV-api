import {Router} from "express";
import {validateRequest} from "../middlewares/validationMiddleware";
import {updateProfileSchema, changePasswordSchema, setPasswordSchema, requestEmailChangeSchema, deleteAccountSchema} from "../schemas/authSchemas";
import {updateProfile, changePassword, uploadProfileImage, setPasswordForGoogleAccount, requestEmailChange, deleteAccount} from "../controllers/userController";
import {upload} from "../middlewares/uploadMiddleware"
const router = Router();

//Al the routes are protected
router.patch('/me', validateRequest(updateProfileSchema), updateProfile);
router.post('/me/avatar', upload.single('avatar'), uploadProfileImage);

router.post('/me/change-password', validateRequest(changePasswordSchema), changePassword);
//TODO_ THIS ROUTE HAS TO BE TESTED IN THE FRONTEND.
router.post('/me/set-password', validateRequest(setPasswordSchema), setPasswordForGoogleAccount);

router.post('/me/request-email-change', validateRequest(requestEmailChangeSchema), requestEmailChange);
router.delete('/me', validateRequest(deleteAccountSchema), deleteAccount);
export default router;
