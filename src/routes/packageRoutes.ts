import {Router} from 'express';
import { getAllPackages, getPackageById } from '../controllers/packageController';

const router = Router();

router.get('/', getAllPackages);
router.get('/:id', getPackageById);

export default router;
