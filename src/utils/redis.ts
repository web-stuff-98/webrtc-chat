import Redis from "ioredis";

const client =
  process.env.NODE_ENV === "production"
    ? new Redis(String(process.env.REDIS_URL), {
        tls: {
          rejectUnauthorized: false,
        },
      })
    : new Redis();

export default client;

/*
import { createClient } from "redis";
import type { RedisClientType } from "redis";
let redisClient: RedisClientType | null = null;
redisClient =
  redisClient ||
  createClient(
    process.env.NODE_ENV !== "production"
      ? {
          socket: {
            host: "127.0.0.1",
            port: 6379,
          },
        }
      : {
          url: process.env.REDIS_URL,
          socket: {
            tls: true,
            rejectUnauthorized: false,
          },
        }
  );

export default redisClient;*/
