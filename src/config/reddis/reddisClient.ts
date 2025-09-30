import {createClient} from 'redis';
import {redisConnection} from './reddis';

export const redisClient = createClient({
    url: `redis://${redisConnection.host}:${redisConnection.port}`
});

redisClient.on('error', (err) => console.error('🔴Redis client error:', err));

/**
 * Connects to the Redis client if it's not already connected.
 */
export const connectToRedis = async () => {
    try {
        await redisClient.connect();
        console.log('✅Connected to Redis successfully.');
    } catch (error) {
        console.error('❌Failed to connect to Redis for caching:', error);
    }
};

connectToRedis();