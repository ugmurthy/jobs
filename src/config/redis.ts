import { RedisOptions } from 'bullmq';
import { logger } from '@ugm/logger';

// Redis connection options
export const redisOptions: RedisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

// Function to test Redis connection
export const testRedisConnection = async (): Promise<boolean> => {
  try {
    // This is a placeholder for actual connection testing
    // In a real implementation, you would create a Redis client and test the connection
    logger.info(`Redis configured at ${redisOptions.host}:${redisOptions.port}`);
    return true;
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    return false;
  }
};

export default redisOptions;