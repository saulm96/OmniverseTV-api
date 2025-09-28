import { Router } from 'express';
import { createSubscription, getUserSubscriptions, cancelSubscription } from '../controllers/subscriptionController';
import { protect } from '../middlewares/authMiddleware';

const router = Router();

// All routes in this file are protected and require a valid token
router.use(protect);

router.get('/', getUserSubscriptions);
router.post('/', createSubscription);
router.patch('/:id', cancelSubscription);

export default router;