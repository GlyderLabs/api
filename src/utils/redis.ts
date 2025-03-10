import { createClient, RedisClientType } from 'redis';
import dotenv from "dotenv"

// Create the Redis client
const redisClient: RedisClientType = createClient({
  url: process.env.REDIS_URL // Update the Redis URL if needed
});

let isConnected = false;

// Connect to Redis on startup
(async () => {
  try {
    await redisClient.connect();
    isConnected = true;
    console.log('Connected to Redis successfully');
  } catch (error) {
    console.error('Error connecting to Redis:', error);
    process.exit(1); // Exit the application if Redis connection fails
  }
})();

// Redis operations
export const setItem = async (key: string, value: string, ttl?: number): Promise<void> => {
  if (!isConnected) throw new Error('Redis client is not connected');
  await redisClient.set(key, value);
  if (ttl) await redisClient.expire(key, ttl); // Set expiration if TTL is provided
};

export const getItem = async (key: string): Promise<string | null> => {
  if (!isConnected) throw new Error('Redis client is not connected');
  return await redisClient.get(key);
};

export const deleteItem = async (key: string): Promise<number> => {
  if (!isConnected) throw new Error('Redis client is not connected');
  return await redisClient.del(key);
};

// New function to check if a token exists
export const tokenExists = async (key: string): Promise<boolean> => {
  if (!isConnected) throw new Error('Redis client is not connected');
  const exists = await redisClient.exists(key);
  return exists > 0; // `exists` returns 1 if the key exists, otherwise 0
};

// Export the Redis client itself, if needed for custom use cases
export default redisClient;
