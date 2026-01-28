const analyticsService = require('../services/analyticsService');
const urlService = require('../services/urlService');

async function analyticsRoutes(fastify, options) {
  // Full analytics (authenticated, owner only)
  fastify.get(
    '/:shortUrl',
    {
      onRequest: [fastify.authenticate],
    },
    async (request, reply) => {
      const { shortUrl } = request.params;
      const userId = request.user.id;

      try {
        // Check ownership
        const belongsToUser = await urlService.urlBelongsToUser(shortUrl, userId);

        if (!belongsToUser) {
          return reply.status(403).send({
            error: 'Forbidden',
            message: 'You do not have access to analytics for this URL',
          });
        }

        const analytics = await analyticsService.getFullAnalytics(shortUrl);

        return reply.send({
          shortUrl,
          analytics,
        });
      } catch (err) {
        request.log.error(err);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to get analytics',
        });
      }
    }
  );

  // Daily analytics
  fastify.get(
    '/:shortUrl/daily',
    {
      onRequest: [fastify.authenticate],
      schema: {
        querystring: {
          type: 'object',
          properties: {
            days: { type: 'integer', minimum: 1, maximum: 365, default: 30 },
          },
        },
      },
    },
    async (request, reply) => {
      const { shortUrl } = request.params;
      const { days } = request.query;
      const userId = request.user.id;

      try {
        const belongsToUser = await urlService.urlBelongsToUser(shortUrl, userId);

        if (!belongsToUser) {
          return reply.status(403).send({
            error: 'Forbidden',
            message: 'You do not have access to analytics for this URL',
          });
        }

        const daily = await analyticsService.getClicksByDay(shortUrl, days);

        return reply.send({
          shortUrl,
          days,
          data: daily,
        });
      } catch (err) {
        request.log.error(err);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to get daily analytics',
        });
      }
    }
  );

  // Geographic analytics
  fastify.get(
    '/:shortUrl/geo',
    {
      onRequest: [fastify.authenticate],
    },
    async (request, reply) => {
      const { shortUrl } = request.params;
      const userId = request.user.id;

      try {
        const belongsToUser = await urlService.urlBelongsToUser(shortUrl, userId);

        if (!belongsToUser) {
          return reply.status(403).send({
            error: 'Forbidden',
            message: 'You do not have access to analytics for this URL',
          });
        }

        const countries = await analyticsService.getClicksByCountry(shortUrl);

        return reply.send({
          shortUrl,
          data: countries,
        });
      } catch (err) {
        request.log.error(err);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to get geo analytics',
        });
      }
    }
  );

  // Device analytics
  fastify.get(
    '/:shortUrl/devices',
    {
      onRequest: [fastify.authenticate],
    },
    async (request, reply) => {
      const { shortUrl } = request.params;
      const userId = request.user.id;

      try {
        const belongsToUser = await urlService.urlBelongsToUser(shortUrl, userId);

        if (!belongsToUser) {
          return reply.status(403).send({
            error: 'Forbidden',
            message: 'You do not have access to analytics for this URL',
          });
        }

        const devices = await analyticsService.getClicksByDevice(shortUrl);

        return reply.send({
          shortUrl,
          data: devices,
        });
      } catch (err) {
        request.log.error(err);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to get device analytics',
        });
      }
    }
  );

  // Browser analytics
  fastify.get(
    '/:shortUrl/browsers',
    {
      onRequest: [fastify.authenticate],
    },
    async (request, reply) => {
      const { shortUrl } = request.params;
      const userId = request.user.id;

      try {
        const belongsToUser = await urlService.urlBelongsToUser(shortUrl, userId);

        if (!belongsToUser) {
          return reply.status(403).send({
            error: 'Forbidden',
            message: 'You do not have access to analytics for this URL',
          });
        }

        const browsers = await analyticsService.getClicksByBrowser(shortUrl);

        return reply.send({
          shortUrl,
          data: browsers,
        });
      } catch (err) {
        request.log.error(err);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to get browser analytics',
        });
      }
    }
  );

  // Referrer analytics
  fastify.get(
    '/:shortUrl/referrers',
    {
      onRequest: [fastify.authenticate],
    },
    async (request, reply) => {
      const { shortUrl } = request.params;
      const userId = request.user.id;

      try {
        const belongsToUser = await urlService.urlBelongsToUser(shortUrl, userId);

        if (!belongsToUser) {
          return reply.status(403).send({
            error: 'Forbidden',
            message: 'You do not have access to analytics for this URL',
          });
        }

        const referrers = await analyticsService.getReferrers(shortUrl);

        return reply.send({
          shortUrl,
          data: referrers,
        });
      } catch (err) {
        request.log.error(err);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to get referrer analytics',
        });
      }
    }
  );
}

module.exports = analyticsRoutes;
