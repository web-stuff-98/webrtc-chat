import Redis from "ioredis";

const client =
  process.env.NODE_ENV === "production"
    ? new Redis(String(process.env.REDIS_TLS_URL), {
        tls: {
          rejectUnauthorized: false,
        },
      })
    : new Redis();

export default client;