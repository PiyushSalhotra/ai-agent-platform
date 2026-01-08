import arcjet, { tokenBucket } from "@arcjet/next";

export const aj = arcjet({
  key: process.env.ARCJET_KEY!, // Get your site key from https://app.arcjet.com
  rules: [
    // Create a token bucket rate limit. Other algorithms are supported.
    tokenBucket({
      mode: "LIVE", // will block requests. Use "DRY_RUN" to log only
      characteristics: ["userId"], // track requests by a custom user ID
      refillRate: 5000, // refill 5000 tokens per interval(free user)
      interval: 30*24*60*60*1000, // refill after every 30 days
      capacity: 50000, // bucket maximum capacity of 5000 tokens(paid)
    }),
  ],
});