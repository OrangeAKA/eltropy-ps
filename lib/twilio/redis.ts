// lib/twilio/redis.ts
//
// Shared Upstash Redis client used by call-state and live-events.
// Reads env vars at module load. If they're missing (e.g. local dev
// without an Upstash binding), the client is null and callers fall
// back to in-memory Maps. Production must have these set or call
// state will not persist across serverless function instances —
// which is what broke the demo before this fix.

import { Redis } from "@upstash/redis";

const url =
  process.env.UPSTASH_REDIS_REST_URL ??
  process.env.KV_REST_API_URL ??
  null;
const token =
  process.env.UPSTASH_REDIS_REST_TOKEN ??
  process.env.KV_REST_API_TOKEN ??
  null;

export const redis: Redis | null =
  url && token ? new Redis({ url, token }) : null;

export const hasRedis: boolean = redis !== null;
