import { Request, Response, NextFunction } from 'express';
import * as subscriptionService from '../services/subscriptionService';

/**
 * Handles the request to create a new subscription.
 */
export const createSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id; // Get user ID from the protect middleware
    const { packageId } = req.body;

    const subscription = await subscriptionService.createSubscription(userId, packageId);
    res.status(201).json(subscription);
  } catch (error) {
    next(error);
  }
};

/**
 * Handles the request to get the current user's subscriptions.
 */
export const getUserSubscriptions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id; // Get user ID from the protect middleware
    const subscriptions = await subscriptionService.getUserSubscriptions(userId);
    res.status(200).json(subscriptions);
  } catch (error) {
    next(error);
  }
};

/**
 * Handles the request to cancel a subscription.
 */
export const cancelSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const subscriptionId = parseInt(req.params.id, 10);
    const userId = req.user!.id;
    const updatedSubscription = await subscriptionService.cancelSubscription(subscriptionId, userId);
    res.status(200).json(updatedSubscription);
  } catch (error) {
    next(error);
  }
};

