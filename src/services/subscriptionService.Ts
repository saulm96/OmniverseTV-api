import { Subscription } from '../models/Subscription';
import { Package } from '../models/Package';
import { ConflictError, NotFoundError } from '../utils/errors';

/**
 * Creates a new subscription for a user to a specific package.
 * @param userId - The ID of the user subscribing.
 * @param packageId - The ID of the package to subscribe to.
 * @returns A promise that resolves to the newly created subscription.
 */
export const createSubscription = async (
  userId: number,
  packageId: number
): Promise<Subscription> => {
  try {
    console.log('Creating subscription for userId:', userId, 'packageId:', packageId);
    
    // Verificar que los parámetros sean válidos
    if (!userId || !packageId) {
      throw new Error('UserId and packageId are required');
    }
    
    console.log('Searching for package...');
    const tvPackage = await Package.findById(packageId);
    console.log('Package found:', tvPackage ? 'Yes' : 'No');
    
    if (!tvPackage) {
      throw new NotFoundError(`Package with ID ${packageId} not found.`);
    }

    console.log('Checking for existing subscription...');
    const existingSubscription = await Subscription.findExisting(
      userId,
      packageId
    );
    console.log('Existing subscription found:', existingSubscription ? 'Yes' : 'No');

    if (existingSubscription) {
      throw new ConflictError('User is already subscribed to this package.');
    }

    console.log('Creating new subscription...');
    const subscription = await Subscription.create({
      userId,
      packageId,
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      status: 'active',
      cancelledAt: null,
    });

    console.log('Subscription created successfully:', subscription.id);
    return subscription;
    
  } catch (error) {
    console.error('Error in createSubscription:', error);
    throw error;
  }
};

/**
 * Retrieves all subscriptions for a specific user.
 * @param userId - The ID of the user whose subscriptions to retrieve.
 * @returns A promise that resolves to an array of the user's subscriptions.
 */
export const getUserSubscriptions = async (
  userId: number
): Promise<Subscription[]> => {
  try {
    console.log('Getting subscriptions for userId:', userId);
    return await Subscription.findAllByUser(userId);
  } catch (error) {
    console.error('Error in getUserSubscriptions:', error);
    throw error;
  }
};

/**
 * Cancels an active subscription for a user.
 * @param subscriptionId The ID of the subscription to cancel.
 * @param userId The ID of the user requesting the cancellation.
 * @returns The updated subscription with 'cancelled' status.
 */
export const cancelSubscription = async (subscriptionId: number, userId: number): Promise<Subscription> => {
  try {
    console.log('Cancelling subscription:', subscriptionId, 'for user:', userId);
    
    // 1. Find the subscription and verify ownership in one go
    const subscription = await Subscription.findByIdAndUser(subscriptionId, userId);

    // 2. Check if the subscription is already cancelled or expired
    if (subscription.status !== 'active') {
        throw new ConflictError(`This subscription is already ${subscription.status}.`);
    }

    // 3. Update the subscription to 'cancelled'
    subscription.status = 'cancelled';
    subscription.cancelledAt = new Date();
    await subscription.save();

    console.log('Subscription cancelled successfully');
    return subscription;
    
  } catch (error) {
    console.error('Error in cancelSubscription:', error);
    throw error;
  }
};