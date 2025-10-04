import {Queue} from 'bullmq';
import {redisConnection} from '../config/reddis/reddis';

export const SUBSCRIPTION_QUEUE_NAME = 'subscriptions_queue';

export const subscriptionQueue = new Queue(SUBSCRIPTION_QUEUE_NAME, {
    connection: redisConnection,
});