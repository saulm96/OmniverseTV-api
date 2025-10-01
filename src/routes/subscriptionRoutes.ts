import { Router } from 'express';
import { createSubscription, getUserSubscriptions, cancelSubscription } from '../controllers/subscriptionController';
import { protect } from '../middlewares/authMiddleware';
import { validateRequest } from '../middlewares/validationMiddleware';
import { createSubscriptionSchema, cancelSubscriptionSchema } from '../schemas/subscriptionSchemas';

const router = Router();

// All routes in this file are protected and require a valid token
router.use(protect);

router.get('/', getUserSubscriptions);
router.post('/', validateRequest(createSubscriptionSchema), createSubscription);
router.patch('/:id', validateRequest(cancelSubscriptionSchema), cancelSubscription);

export default router;