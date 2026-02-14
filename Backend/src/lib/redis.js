import IORedis from "ioredis";

// For development, create an in-memory Redis instance
const redis = new IORedis({
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times) => {
    if (times > 3) {
      console.log("[Redis] Max retries reached, using offline mode");
      return null;
    }
    return Math.min(times * 100, 1000);
  },
  enableOfflineQueue: true,
  maxRetriesPerRequest: null,
});

redis.on("connect", () => {
  console.log("[Redis] Connected to Redis");
});

redis.on("error", (err) => {
  console.log(
    "[Redis] Using offline mode (messages will be processed but not persisted across restarts)",
  );
});

redis.on("reconnecting", () => {
  console.log("[Redis] Attempting to reconnect...");
});

export default redis;
