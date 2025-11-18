import { db } from '../lib/db.js'
import { NotFoundError, ConflictError, ValidationError } from '../lib/errors.js'
import { logger } from '../lib/logger.js'
import { EVENT_TYPES, eventBus } from '../lib/events.js'
import type { Community, Prisma } from '@prisma/client'

export interface CreateCommunityInput {
  name: string
  slug: string
  description?: string
  settings?: Record<string, any>
  tags?: string[]
}

export interface UpdateCommunityInput {
  name?: string
  description?: string
  settings?: Record<string, any>
  tags?: string[]
  status?: 'active' | 'archived' | 'suspended'
}

export class CommunityService {
  private log = logger.child({ service: 'CommunityService' })

  /**
   * Create a new community
   */
  async create(input: CreateCommunityInput): Promise<Community> {
    this.log.info('Creating community', { slug: input.slug })

    // Check if slug is already taken
    const existing = await db.community.findUnique({
      where: { slug: input.slug },
    })

    if (existing) {
      throw new ConflictError(`Community with slug '${input.slug}' already exists`)
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(input.slug)) {
      throw new ValidationError('Slug must contain only lowercase letters, numbers, and hyphens')
    }

    const community = await db.community.create({
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description,
        settings: input.settings || {},
        tags: input.tags || [],
      },
    })

    // Emit event
    await eventBus.publish(EVENT_TYPES.COMMUNITY_CREATED, {
      communityId: community.id,
      name: community.name,
      slug: community.slug,
    })

    this.log.info('Community created', { communityId: community.id, slug: community.slug })

    return community
  }

  /**
   * Get community by ID
   */
  async getById(id: string): Promise<Community> {
    const community = await db.community.findUnique({
      where: { id },
    })

    if (!community) {
      throw new NotFoundError('Community', id)
    }

    return community
  }

  /**
   * Get community by slug
   */
  async getBySlug(slug: string): Promise<Community> {
    const community = await db.community.findUnique({
      where: { slug },
    })

    if (!community) {
      throw new NotFoundError('Community', slug)
    }

    return community
  }

  /**
   * List communities with filtering
   */
  async list(options: {
    status?: string
    tags?: string[]
    limit?: number
    offset?: number
  } = {}): Promise<{ communities: Community[]; total: number }> {
    const where: Prisma.CommunityWhereInput = {}

    if (options.status) {
      where.status = options.status
    }

    if (options.tags && options.tags.length > 0) {
      where.tags = { hasSome: options.tags }
    }

    const [communities, total] = await Promise.all([
      db.community.findMany({
        where,
        take: options.limit || 50,
        skip: options.offset || 0,
        orderBy: { createdAt: 'desc' },
      }),
      db.community.count({ where }),
    ])

    return { communities, total }
  }

  /**
   * Update community
   */
  async update(id: string, input: UpdateCommunityInput): Promise<Community> {
    this.log.info('Updating community', { communityId: id })

    // Check if exists
    await this.getById(id)

    const community = await db.community.update({
      where: { id },
      data: input,
    })

    this.log.info('Community updated', { communityId: id })

    return community
  }

  /**
   * Delete community (soft delete by archiving)
   */
  async delete(id: string): Promise<void> {
    this.log.info('Deleting community', { communityId: id })

    await this.update(id, { status: 'archived' })

    this.log.info('Community deleted (archived)', { communityId: id })
  }

  /**
   * Get community statistics
   */
  async getStats(id: string): Promise<{
    nodeCount: number
    edgeCount: number
    scenarioCount: number
    campaignCount: number
    templateCount: number
  }> {
    const [nodeCount, edgeCount, scenarioCount, campaignCount, templateCount] =
      await Promise.all([
        db.influenceNode.count({ where: { communityId: id } }),
        db.influenceEdge.count({ where: { communityId: id } }),
        db.propagationScenario.count({ where: { communityId: id } }),
        db.campaign.count({ where: { communityId: id } }),
        db.scenarioTemplate.count({ where: { communityId: id } }),
      ])

    return {
      nodeCount,
      edgeCount,
      scenarioCount,
      campaignCount,
      templateCount,
    }
  }
}
