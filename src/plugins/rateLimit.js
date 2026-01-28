const fp = require('fastify-plugin');
const redis = require('../config/redis');

async function rateLimitPlugin(fastify, options) {
  await fastify.register(require('@fastify/rate-limit'), {
    global: true,
    max: 100,
    timeWindow: '1 minute',
    redis: redis,
    skipOnError: true,
    keyGenerator: (request) => {
      return request.ip;
    },
    errorResponseBuilder: (request, context) => {
      return {
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Try again in ${Math.ceil(context.ttl / 1000)} seconds`,
        retryAfter: Math.ceil(context.ttl / 1000),
      };
    },
  });

  // Route-specific rate limit configs
  fastify.decorate('rateLimits', {
    auth: { max: 10, timeWindow: '1 minute' },        // Login/Register
    createUrl: { max: 20, timeWindow: '1 minute' },   // URL creation
    redirect: { max: 100, timeWindow: '1 minute' },   // Redirects
    api: { max: 200, timeWindow: '1 minute' },        // General API
  });
}

module.exports = fp(rateLimitPlugin, {
  name: 'rate-limit-plugin',
});
