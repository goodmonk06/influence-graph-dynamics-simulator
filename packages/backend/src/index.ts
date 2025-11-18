import Fastify from 'fastify'
import cors from '@fastify/cors'
import { nodeRoutes } from './routes/nodes.js'
import { edgeRoutes } from './routes/edges.js'
import { scenarioRoutes } from './routes/scenarios.js'

const PORT = parseInt(process.env.PORT || '3001', 10)
const HOST = process.env.HOST || '0.0.0.0'

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport:
      process.env.NODE_ENV === 'development'
        ? {
            target: 'pino-pretty',
            options: {
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
  },
})

// Register CORS
await fastify.register(cors, {
  origin: process.env.CORS_ORIGIN || true,
})

// Health check
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() }
})

// Register API routes
await fastify.register(nodeRoutes, { prefix: '/api' })
await fastify.register(edgeRoutes, { prefix: '/api' })
await fastify.register(scenarioRoutes, { prefix: '/api' })

// Error handler
fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error)

  // Zod validation errors
  if (error.name === 'ZodError') {
    return reply.code(400).send({
      error: 'Validation error',
      details: error.message,
    })
  }

  // Prisma errors
  if (error.name === 'PrismaClientKnownRequestError') {
    return reply.code(400).send({
      error: 'Database error',
      message: error.message,
    })
  }

  // Default error
  return reply.code(500).send({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : undefined,
  })
})

// Start server
try {
  await fastify.listen({ port: PORT, host: HOST })
  console.log(`Server listening on http://${HOST}:${PORT}`)
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}
