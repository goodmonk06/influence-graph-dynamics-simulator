import Fastify from 'fastify'
import cors from '@fastify/cors'
import { nodeRoutes } from './routes/nodes.js'
import { edgeRoutes } from './routes/edges.js'
import { scenarioRoutes } from './routes/scenarios.js'
import { communityRoutes } from './routes/communities.js'
import { campaignRoutes } from './routes/campaigns.js'
import { templateRoutes } from './routes/templates.js'
import { batchRoutes } from './routes/batches.js'
import { isAppError, formatErrorResponse, getErrorStatusCode } from './lib/errors.js'
import { logger } from './lib/logger.js'
import { metrics, METRICS } from './lib/metrics.js'

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

// Request logging and metrics middleware
fastify.addHook('onRequest', async (request, reply) => {
  request.startTime = Date.now()
  metrics.incrementCounter(METRICS.API_REQUEST_COUNT, {
    method: request.method,
    route: request.routerPath || 'unknown',
  })
})

fastify.addHook('onResponse', async (request, reply) => {
  const duration = Date.now() - (request.startTime || Date.now())
  metrics.recordHistogram(METRICS.API_REQUEST_DURATION, duration, {
    method: request.method,
    route: request.routerPath || 'unknown',
    status: reply.statusCode,
  })
})

// Register CORS
await fastify.register(cors, {
  origin: process.env.CORS_ORIGIN || true,
})

// Health check
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' }
})

// Metrics endpoint (for monitoring)
fastify.get('/metrics', async () => {
  return {
    counters: {
      apiRequests: metrics.getCounter(METRICS.API_REQUEST_COUNT),
      simulations: metrics.getCounter(METRICS.SIMULATION_COUNT),
    },
    timestamp: new Date().toISOString(),
  }
})

// Register API routes
await fastify.register(communityRoutes, { prefix: '/api' })
await fastify.register(nodeRoutes, { prefix: '/api' })
await fastify.register(edgeRoutes, { prefix: '/api' })
await fastify.register(scenarioRoutes, { prefix: '/api' })
await fastify.register(campaignRoutes, { prefix: '/api' })
await fastify.register(templateRoutes, { prefix: '/api' })
await fastify.register(batchRoutes, { prefix: '/api' })

// Enhanced error handler
fastify.setErrorHandler((error, request, reply) => {
  // Log error with context
  logger.error('Request error', error, {
    method: request.method,
    url: request.url,
    requestId: request.id,
  })

  // Track error metrics
  metrics.incrementCounter(METRICS.API_ERROR_COUNT, {
    method: request.method,
    route: request.routerPath || 'unknown',
    error: error.name,
  })

  // Zod validation errors
  if (error.name === 'ZodError') {
    return reply.code(400).send({
      error: 'Validation error',
      code: 'VALIDATION_ERROR',
      details: error.message,
    })
  }

  // Prisma errors
  if (error.name === 'PrismaClientKnownRequestError') {
    return reply.code(400).send({
      error: 'Database error',
      code: 'DATABASE_ERROR',
      message: error.message,
    })
  }

  // Custom app errors
  if (isAppError(error)) {
    const statusCode = getErrorStatusCode(error)
    return reply.code(statusCode).send(formatErrorResponse(error))
  }

  // Default error
  return reply.code(500).send({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    message: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred',
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
