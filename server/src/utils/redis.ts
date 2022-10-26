import { createClient } from "redis";
import type { RedisClientType } from "redis";
let redisClient: RedisClientType | null = null;
redisClient =
  redisClient ||
  createClient({
    socket: {
      host: "127.0.0.1",
      port: 6379,
    },
  });
/*redisClient.on("error", (err) => {
});*/
export default redisClient;
