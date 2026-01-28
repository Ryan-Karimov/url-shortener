const urlService = require('../services/urlService');
const { isValidUrl } = require('../utils/helpers');

async function urlRoutes(fastify, options) {
  // Create short URL (authenticated)
  fastify.post(
    '/',
    {
      onRequest: [fastify.authenticate],
      config: {
        rateLimit: fastify.rateLimits.createUrl,
      },
      schema: {
        body: {
          type: 'object',
          required: ['originalUrl'],
          properties: {
            originalUrl: { type: 'string' },
            alias: { type: 'string', maxLength: 20 },
            expiresAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    async (request, reply) => {
      const { originalUrl, alias, expiresAt } = request.body;
      const userId = request.user.id;

      // Validate URL
      if (!isValidUrl(originalUrl)) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Invalid URL format',
        });
      }

      try {
        const url = await urlService.createUrl(originalUrl, alias, expiresAt, userId);
        const baseUrl = `${request.protocol}://${request.hostname}`;

        return reply.status(201).send({
          shortUrl: `${baseUrl}/${url.short_url}`,
          shortCode: url.short_url,
          originalUrl: url.original_url,
          alias: url.alias,
          expiresAt: url.expires_at,
          createdAt: url.created_at,
        });
      } catch (err) {
        if (err.message.includes('Alias')) {
          return reply.status(400).send({
            error: 'Bad Request',
            message: err.message,
          });
        }

        request.log.error(err);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to create short URL',
        });
      }
    }
  );

  // Get user's URLs (authenticated)
  fastify.get(
    '/',
    {
      onRequest: [fastify.authenticate],
      schema: {
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'integer', minimum: 1, default: 1 },
            limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          },
        },
      },
    },
    async (request, reply) => {
      const { page, limit } = request.query;
      const userId = request.user.id;

      try {
        const result = await urlService.getUserUrls(userId, page, limit);
        const baseUrl = `${request.protocol}://${request.hostname}`;

        // Add full URL to each item
        const urlsWithFullUrl = result.urls.map((url) => ({
          ...url,
          fullShortUrl: `${baseUrl}/${url.short_url}`,
        }));

        return reply.send({
          ...result,
          urls: urlsWithFullUrl,
        });
      } catch (err) {
        request.log.error(err);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to get URLs',
        });
      }
    }
  );

  // Get URL info (authenticated, owner only)
  fastify.get(
    '/:shortUrl',
    {
      onRequest: [fastify.authenticate],
    },
    async (request, reply) => {
      const { shortUrl } = request.params;
      const userId = request.user.id;

      try {
        const urlInfo = await urlService.getUrlInfo(shortUrl);

        if (!urlInfo) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'URL not found',
          });
        }

        // Check ownership
        if (urlInfo.user_id !== userId) {
          return reply.status(403).send({
            error: 'Forbidden',
            message: 'You do not have access to this URL',
          });
        }

        const baseUrl = `${request.protocol}://${request.hostname}`;

        return reply.send({
          shortUrl: urlInfo.short_url,
          fullShortUrl: `${baseUrl}/${urlInfo.short_url}`,
          originalUrl: urlInfo.original_url,
          alias: urlInfo.alias,
          clickCount: urlInfo.click_count,
          expiresAt: urlInfo.expires_at,
          createdAt: urlInfo.created_at,
        });
      } catch (err) {
        request.log.error(err);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to get URL info',
        });
      }
    }
  );

  // Delete URL (authenticated, owner only)
  fastify.delete(
    '/:shortUrl',
    {
      onRequest: [fastify.authenticate],
    },
    async (request, reply) => {
      const { shortUrl } = request.params;
      const userId = request.user.id;

      try {
        const deleted = await urlService.deleteUrl(shortUrl, userId);

        if (!deleted) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'URL not found or you do not have permission to delete it',
          });
        }

        return reply.status(204).send();
      } catch (err) {
        request.log.error(err);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to delete URL',
        });
      }
    }
  );
}

module.exports = urlRoutes;
