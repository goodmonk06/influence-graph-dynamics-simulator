import { db } from '../lib/db.js'
import { NotFoundError } from '../lib/errors.js'
import { logger } from '../lib/logger.js'
import { EVENT_TYPES, eventBus } from '../lib/events.js'
import type { Campaign } from '@prisma/client'

export interface CreateCampaignInput {
  communityId: string
  name: string
  description?: string
  type: string
  startDate?: Date
  endDate?: Date
  goalJson?: Record<string, any>
  tags?: string[]
}

export class CampaignService {
  private log = logger.child({ service: 'CampaignService' })

  async create(input: CreateCampaignInput): Promise<Campaign> {
    this.log.info('Creating campaign', { communityId: input.communityId, name: input.name })

    const campaign = await db.campaign.create({
      data: {
        ...input,
        status: 'planned',
      },
    })

    await eventBus.publish(EVENT_TYPES.CAMPAIGN_CREATED, {
      campaignId: campaign.id,
      communityId: campaign.communityId,
      name: campaign.name,
      type: campaign.type,
    })

    return campaign
  }

  async getById(id: string): Promise<Campaign> {
    const campaign = await db.campaign.findUnique({ where: { id } })
    if (!campaign) throw new NotFoundError('Campaign', id)
    return campaign
  }

  async list(communityId: string): Promise<Campaign[]> {
    return db.campaign.findMany({
      where: { communityId },
      orderBy: { createdAt: 'desc' },
    })
  }

  async update(id: string, data: Partial<CreateCampaignInput>): Promise<Campaign> {
    await this.getById(id)
    return db.campaign.update({ where: { id }, data })
  }

  async updateMetrics(id: string, actualMetrics: Record<string, any>): Promise<Campaign> {
    return db.campaign.update({
      where: { id },
      data: { actualMetricsJson: actualMetrics, status: 'completed' },
    })
  }
}
