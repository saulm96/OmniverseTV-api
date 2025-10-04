import { Subscription } from '../models/Subscription';
import { Package } from '../models/Package';
import { ConflictError, NotFoundError } from '../utils/errors';
import { subscriptionQueue } from '../queues/subscriptionQueue';

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
  const tvPackage = await Package.findById(packageId);
  if (!tvPackage) {
    throw new NotFoundError(`Package with ID ${packageId} not found.`);
  }

  const existingSubscription = await Subscription.findExisting(
    userId,
    packageId
  );

  if (existingSubscription) {
    throw new ConflictError('User is already subscribed to this package.');
  }

  const startDate = new Date();
  //TODO: 15 sec expiration i nthe subscription just for testing. it has to be changed to the real expiration time (1month)
  const endDate = new Date(Date.now() + 15000); // 15 seconds for testing

  const subscription = await Subscription.create({
    userId,
    packageId,
    startDate,
    endDate,
    status: 'active',
  });

  const delay = endDate.getTime() - Date.now();
  if (delay > 0) {
    await subscriptionQueue.add(
      'expire-subscription',
      { subscriptionId: subscription.id },
      { delay }
    );
    console.log(`--> Scheduled expiration job for subscription #${subscription.id} to run in ${Math.round(delay/1000)}s`);
  }

  return subscription;
};

/**
 * Retrieves all subscriptions for a specific user.
 * @param userId - The ID of the user whose subscriptions to retrieve.
 * @returns A promise that resolves to an array of the user's subscriptions.
 */
export const getUserSubscriptions = async (
  userId: number
): Promise<Subscription[]> => {
  return Subscription.findAllByUser(userId);
};

/**
 * Cancels an active subscription for a user.
 * @param subscriptionId The ID of the subscription to cancel.
 * @param userId The ID of the user requesting the cancellation.
 * @returns The updated subscription with 'cancelled' status.
 */
export const cancelSubscription = async (
  subscriptionId: number,
  userId: number
): Promise<Subscription> => {
  const subscription = await Subscription.findOne({ where: { id: subscriptionId, userId } });

  if (!subscription) {
    throw new NotFoundError(`Subscription with ID ${subscriptionId} not found or does not belong to the user.`);
  }

  if (subscription.status !== 'active') {
    throw new ConflictError(`This subscription is already ${subscription.status}.`);
  }

  subscription.status = 'cancelled';
  subscription.cancelledAt = new Date();
  await subscription.save();

  return subscription;
};