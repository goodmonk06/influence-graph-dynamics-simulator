import { db } from '../lib/db.js'
import { NotFoundError } from '../lib/errors.js'
import { logger } from '../lib/logger.js'
import type { ScenarioTemplate } from '@prisma/client'

export interface CreateTemplateInput {
  communityId?: string
  name: string
  description?: string
  category: string
  isPublic?: boolean
  parametersJson: Record<string, any>
  seedSelectionStrategy: string
  tags?: string[]
}

export class TemplateService {
  private log = logger.child({ service: 'TemplateService' })

  async create(input: CreateTemplateInput): Promise<ScenarioTemplate> {
    this.log.info('Creating scenario template', { name: input.name })

    return db.scenarioTemplate.create({
      data: {
        ...input,
        isPublic: input.isPublic ?? false,
        usageCount: 0,
      },
    })
  }

  async getById(id: string): Promise<ScenarioTemplate> {
    const template = await db.scenarioTemplate.findUnique({ where: { id } })
    if (!template) throw new NotFoundError('ScenarioTemplate', id)
    return template
  }

  async list(options: {
    communityId?: string
    category?: string
    isPublic?: boolean
  } = {}): Promise<ScenarioTemplate[]> {
    const where: any = {}

    if (options.communityId !== undefined) {
      where.communityId = options.communityId
    }
    if (options.category) {
      where.category = options.category
    }
    if (options.isPublic !== undefined) {
      where.isPublic = options.isPublic
    }

    return db.scenarioTemplate.findMany({
      where,
      orderBy: [{ usageCount: 'desc' }, { createdAt: 'desc' }],
    })
  }

  async incrementUsage(id: string): Promise<void> {
    await db.scenarioTemplate.update({
      where: { id },
      data: { usageCount: { increment: 1 } },
    })
  }
}
