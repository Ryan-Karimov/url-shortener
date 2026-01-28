const urlService = require('../services/urlService');
const { getClientIp } = require('../utils/helpers');

async function redirectRoutes(fastify, options) {
  // Public redirect endpoint
  fastify.get(
    '/:shortUrl',
    {
      config: {
        rateLimit: fastify.rateLimits.redirect,
      },
    },
    async (request, reply) => {
      const { shortUrl } = request.params;

      // Skip if it looks like an API route or static file
      if (shortUrl.startsWith('api') || shortUrl.startsWith('auth') || shortUrl.includes('.')) {
        return reply.status(404).send({ error: 'Not Found' });
      }

      try {
        const ip = getClientIp(request);
        const userAgent = request.headers['user-agent'] || '';
        const referrer = request.headers['referer'] || request.headers['referrer'] || null;

        const result = await urlService.handleRedirect(shortUrl, ip, userAgent, referrer);

        if (result.error === 'not_found') {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'Short URL not found',
          });
        }

        if (result.error === 'expired') {
          return reply.status(410).send({
            error: 'Gone',
            message: 'This short URL has expired',
          });
        }

        return reply.redirect(301, result.originalUrl);
      } catch (err) {
        request.log.error(err);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to redirect',
        });
      }
    }
  );
}

module.exports = redirectRoutes;
