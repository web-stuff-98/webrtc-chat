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
//# sourceMappingURL=redis.js.map