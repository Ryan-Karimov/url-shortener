const fp = require('fastify-plugin');

async function authPlugin(fastify, options) {
  fastify.register(require('@fastify/jwt'), {
    secret: process.env.JWT_SECRET || 'super-secret-key-change-in-production',
    sign: {
      expiresIn: '7d',
    },
  });

  // Decorator for protected routes
  fastify.decorate('authenticate', async function (request, reply) {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({ error: 'Unauthorized', message: 'Invalid or expired token' });
    }
  });

  // Optional auth - sets user if token exists, but doesn't require it
  fastify.decorate('optionalAuth', async function (request, reply) {
    try {
      await request.jwtVerify();
    } catch (err) {
      // Token is optional, so we just continue without user
      request.user = null;
    }
  });
}

module.exports = fp(authPlugin, {
  name: 'auth-plugin',
});
