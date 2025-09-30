import 'dotenv/config';

export const redisConnection={
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379', 10)
}