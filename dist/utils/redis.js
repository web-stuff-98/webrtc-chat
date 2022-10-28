"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ioredis_1 = __importDefault(require("ioredis"));
const client = process.env.NODE_ENV === "production"
    ? new ioredis_1.default(String(process.env.REDIS_URL), {
        tls: {
            rejectUnauthorized: false,
        },
    })
    : new ioredis_1.default();
exports.default = client;
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
//# sourceMappingURL=redis.js.map