const path = require('path');
require('dotenv').config();

const fastify = require('fastify')({
  logger: true,
  trustProxy: true,
});

// Plugins
fastify.register(require('@fastify/cors'), {
  origin: true,
  credentials: true,
});
fastify.register(require('@fastify/formbody'));

// Static files
fastify.register(require('@fastify/static'), {
  root: path.join(__dirname, '..', 'public'),
  prefix: '/static/',
});

// Serve index.html on root
fastify.get('/', async (request, reply) => {
  return reply.sendFile('index.html');
});

// Custom plugins
fastify.register(require('./plugins/auth'));
fastify.register(require('./plugins/rateLimit'));

// Routes
fastify.register(require('./routes/auth'), { prefix: '/auth' });
fastify.register(require('./routes/urls'), { prefix: '/api/urls' });
fastify.register(require('./routes/analytics'), { prefix: '/api/analytics' });
fastify.register(require('./routes/redirect'));

// Health check
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Start server
const start = async () => {
  try {
    const port = process.env.PORT || 3000;
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`Server is running on port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
