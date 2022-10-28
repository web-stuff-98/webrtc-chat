"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redis_1 = require("redis");
let redisClient = null;
redisClient =
    redisClient ||
        (0, redis_1.createClient)({
            socket: {
                host: "127.0.0.1",
                port: 6379,
            },
        });
/*redisClient.on("error", (err) => {
});*/
exports.default = redisClient;
//# sourceMappingURL=redis.js.map