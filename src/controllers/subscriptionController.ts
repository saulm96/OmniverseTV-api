// src/controllers/subscriptionController.ts

import { Request, Response, NextFunction } from 'express';
import * as subscriptionService from '../services/subscriptionService';

// CAMBIO 1: Importamos el modelo User pero le damos el alias "UserModel"
// para evitar cualquier conflicto con otros tipos llamados "User".
import { User as UserModel } from '../models/User';

/**
 * Handles the request to create a new subscription.
 */
export const createSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // CAMBIO 2: Hacemos una aserción de tipo explícita usando nuestro alias "UserModel".
    // Ahora TypeScript sabe sin lugar a dudas que este objeto tiene una propiedad 'id'.
    const user = req.user as UserModel;
    const userId = user.id; 
    
    // Agregamos una comprobación por si acaso
    if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
    }

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
    const user = req.user as UserModel;
    const userId = user.id;

    if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
    }

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
    const user = req.user as UserModel;
    const userId = user.id;

    if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const updatedSubscription = await subscriptionService.cancelSubscription(subscriptionId, userId);
    res.status(200).json(updatedSubscription);
  } catch (error) {
    next(error);
  }
};