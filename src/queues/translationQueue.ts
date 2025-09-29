import {Queue} from 'bullmq';
import {redisConnection} from '../config/reddis';

const TRANSLATION_QUEUE_NAME = 'translations_queue';

export const translationQueue = new Queue(TRANSLATION_QUEUE_NAME, {connection: redisConnection});