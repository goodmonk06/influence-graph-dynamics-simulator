import { db } from '../lib/db.js'
import { NotFoundError, SimulationError } from '../lib/errors.js'
import { logger } from '../lib/logger.js'
import { EVENT_TYPES, eventBus } from '../lib/events.js'
import { SimulationService } from './simulation.service.js'
import type { SimulationBatch } from '@prisma/client'

export interface CreateBatchInput {
  communityId: string
  name: string
  description?: string
  batchType: string
  scenarioIds: string[]
  configJson?: Record<string, any>
}

export class BatchService {
  private log = logger.child({ service: 'BatchService' })
  private simulationService = new SimulationService()

  async create(input: CreateBatchInput): Promise<SimulationBatch> {
    this.log.info('Creating simulation batch', { communityId: input.communityId })

    const batch = await db.simulationBatch.create({
      data: {
        communityId: input.communityId,
        name: input.name,
        description: input.description,
        batchType: input.batchType,
        status: 'pending',
        configJson: input.configJson || {},
      },
    })

    // Create batch scenario links
    await Promise.all(
      input.scenarioIds.map((scenarioId, index) =>
        db.batchScenario.create({
          data: {
            batchId: batch.id,
            scenarioId,
            runOrder: index,
          },
        })
      )
    )

    await eventBus.publish(EVENT_TYPES.BATCH_STARTED, {
      batchId: batch.id,
      communityId: batch.communityId,
      scenarioCount: input.scenarioIds.length,
    })

    return batch
  }

  async getById(id: string): Promise<SimulationBatch> {
    const batch = await db.simulationBatch.findUnique({ where: { id } })
    if (!batch) throw new NotFoundError('SimulationBatch', id)
    return batch
  }

  async execute(id: string): Promise<SimulationBatch> {
    this.log.info('Executing simulation batch', { batchId: id })

    const batch = await this.getById(id)

    await db.simulationBatch.update({
      where: { id },
      data: { status: 'running' },
    })

    const batchScenarios = await db.batchScenario.findMany({
      where: { batchId: id },
      orderBy: { runOrder: 'asc' },
    })

    const startTime = Date.now()
    let successCount = 0
    let failureCount = 0
    const results: any[] = []

    for (const bs of batchScenarios) {
      try {
        await db.batchScenario.update({
          where: { id: bs.id },
          data: { status: 'running' },
        })

        const result = await this.simulationService.runScenario(bs.scenarioId)
        results.push({
          scenarioId: bs.scenarioId,
          resultId: result.resultId,
          success: true,
        })

        await db.batchScenario.update({
          where: { id: bs.id },
          data: { status: 'completed', completedAt: new Date() },
        })

        successCount++
      } catch (error) {
        this.log.error('Batch scenario failed', error, {
          batchId: id,
          scenarioId: bs.scenarioId,
        })

        await db.batchScenario.update({
          where: { id: bs.id },
          data: {
            status: 'failed',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            completedAt: new Date(),
          },
        })

        failureCount++
      }
    }

    const executionTimeMs = Date.now() - startTime

    const updatedBatch = await db.simulationBatch.update({
      where: { id },
      data: {
        status: failureCount === 0 ? 'completed' : 'failed',
        executionTimeMs,
        resultsJson: { results, successCount, failureCount },
        completedAt: new Date(),
      },
    })

    await eventBus.publish(EVENT_TYPES.BATCH_COMPLETED, {
      batchId: id,
      communityId: batch.communityId,
      successCount,
      failureCount,
      totalExecutionTimeMs: executionTimeMs,
    })

    return updatedBatch
  }

  async list(communityId: string): Promise<SimulationBatch[]> {
    return db.simulationBatch.findMany({
      where: { communityId },
      orderBy: { createdAt: 'desc' },
    })
  }
}
