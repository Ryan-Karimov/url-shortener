const userModel = require('../models/userModel');

async function authRoutes(fastify, options) {
  // Register
  fastify.post(
    '/register',
    {
      config: {
        rateLimit: fastify.rateLimits.auth,
      },
      schema: {
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 6 },
          },
        },
      },
    },
    async (request, reply) => {
      const { email, password } = request.body;

      try {
        // Check if email exists
        if (await userModel.emailExists(email)) {
          return reply.status(409).send({
            error: 'Conflict',
            message: 'Email already registered',
          });
        }

        // Create user
        const user = await userModel.createUser(email, password);

        // Generate token
        const token = fastify.jwt.sign({ id: user.id, email: user.email });

        return reply.status(201).send({
          message: 'User registered successfully',
          user: {
            id: user.id,
            email: user.email,
            createdAt: user.created_at,
          },
          token,
        });
      } catch (err) {
        request.log.error(err);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to register user',
        });
      }
    }
  );

  // Login
  fastify.post(
    '/login',
    {
      config: {
        rateLimit: fastify.rateLimits.auth,
      },
      schema: {
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const { email, password } = request.body;

      try {
        // Find user
        const user = await userModel.findByEmail(email);

        if (!user) {
          return reply.status(401).send({
            error: 'Unauthorized',
            message: 'Invalid email or password',
          });
        }

        // Verify password
        const validPassword = await userModel.verifyPassword(password, user.password_hash);

        if (!validPassword) {
          return reply.status(401).send({
            error: 'Unauthorized',
            message: 'Invalid email or password',
          });
        }

        // Generate token
        const token = fastify.jwt.sign({ id: user.id, email: user.email });

        return reply.send({
          message: 'Login successful',
          user: {
            id: user.id,
            email: user.email,
            createdAt: user.created_at,
          },
          token,
        });
      } catch (err) {
        request.log.error(err);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to login',
        });
      }
    }
  );

  // Get current user
  fastify.get(
    '/me',
    {
      onRequest: [fastify.authenticate],
    },
    async (request, reply) => {
      try {
        const user = await userModel.findById(request.user.id);

        if (!user) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'User not found',
          });
        }

        return reply.send({
          user: {
            id: user.id,
            email: user.email,
            createdAt: user.created_at,
          },
        });
      } catch (err) {
        request.log.error(err);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to get user info',
        });
      }
    }
  );
}

module.exports = authRoutes;
