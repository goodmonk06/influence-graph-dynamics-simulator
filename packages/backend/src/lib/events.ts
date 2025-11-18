/**
 * Domain event system for extensibility and integration
 */

import { logger } from './logger.js'

// ============================================================================
// Event Types
// ============================================================================

export interface DomainEvent<T = any> {
  type: string
  timestamp: Date
  data: T
  metadata?: {
    userId?: string
    communityId?: string
    requestId?: string
    [key: string]: any
  }
}

export type EventHandler<T = any> = (event: DomainEvent<T>) => Promise<void> | void

// ============================================================================
// Specific Domain Events
// ============================================================================

export interface CommunityCreatedEvent {
  communityId: string
  name: string
  slug: string
}

export interface NodeCreatedEvent {
  nodeId: string
  communityId: string
  memberId: string
  baseInfluenceScore: number
}

export interface EdgeCreatedEvent {
  edgeId: string
  communityId: string
  fromNodeId: string
  toNodeId: string
  strength: number
  relationType: string
}

export interface ScenarioCreatedEvent {
  scenarioId: string
  communityId: string
  name: string
}

export interface SimulationStartedEvent {
  scenarioId: string
  communityId: string
  nodeCount: number
  edgeCount: number
}

export interface SimulationCompletedEvent {
  scenarioId: string
  resultId: string
  communityId: string
  totalIterations: number
  finalActiveCount: number
  convergenceReason: string
  executionTimeMs: number
}

export interface SimulationFailedEvent {
  scenarioId: string
  communityId: string
  error: string
}

export interface BatchStartedEvent {
  batchId: string
  communityId: string
  scenarioCount: number
}

export interface BatchCompletedEvent {
  batchId: string
  communityId: string
  successCount: number
  failureCount: number
  totalExecutionTimeMs: number
}

export interface InsightGeneratedEvent {
  insightId: string
  communityId: string
  type: string
  severity: string
  title: string
}

export interface CampaignCreatedEvent {
  campaignId: string
  communityId: string
  name: string
  type: string
}

export interface ThresholdExceededEvent {
  communityId: string
  threshold: string
  currentValue: number
  limit: number
}

// Event type constants
export const EVENT_TYPES = {
  COMMUNITY_CREATED: 'community.created',
  NODE_CREATED: 'node.created',
  EDGE_CREATED: 'edge.created',
  SCENARIO_CREATED: 'scenario.created',
  SIMULATION_STARTED: 'simulation.started',
  SIMULATION_COMPLETED: 'simulation.completed',
  SIMULATION_FAILED: 'simulation.failed',
  BATCH_STARTED: 'batch.started',
  BATCH_COMPLETED: 'batch.completed',
  INSIGHT_GENERATED: 'insight.generated',
  CAMPAIGN_CREATED: 'campaign.created',
  THRESHOLD_EXCEEDED: 'threshold.exceeded',
} as const

// ============================================================================
// Event Bus
// ============================================================================

class EventBus {
  private handlers: Map<string, Set<EventHandler>> = new Map()
  private globalHandlers: Set<EventHandler> = new Set()

  /**
   * Register a handler for a specific event type
   */
  on(eventType: string, handler: EventHandler): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set())
    }
    this.handlers.get(eventType)!.add(handler)

    // Return unsubscribe function
    return () => {
      this.off(eventType, handler)
    }
  }

  /**
   * Register a handler for all events
   */
  onAll(handler: EventHandler): () => void {
    this.globalHandlers.add(handler)

    // Return unsubscribe function
    return () => {
      this.offAll(handler)
    }
  }

  /**
   * Unregister a handler for a specific event type
   */
  off(eventType: string, handler: EventHandler): void {
    const handlers = this.handlers.get(eventType)
    if (handlers) {
      handlers.delete(handler)
    }
  }

  /**
   * Unregister a global handler
   */
  offAll(handler: EventHandler): void {
    this.globalHandlers.delete(handler)
  }

  /**
   * Emit an event to all registered handlers
   */
  async emit<T>(event: DomainEvent<T>): Promise<void> {
    const specificHandlers = this.handlers.get(event.type) || new Set()
    const allHandlers = [...specificHandlers, ...this.globalHandlers]

    logger.debug('Event emitted', {
      type: event.type,
      handlerCount: allHandlers.length,
      metadata: event.metadata,
    })

    const promises = allHandlers.map(async (handler) => {
      try {
        await handler(event)
      } catch (error) {
        logger.error(`Event handler failed for ${event.type}`, error, {
          eventType: event.type,
          metadata: event.metadata,
        })
      }
    })

    await Promise.allSettled(promises)
  }

  /**
   * Create and emit an event
   */
  async publish<T>(
    type: string,
    data: T,
    metadata?: DomainEvent['metadata']
  ): Promise<void> {
    const event: DomainEvent<T> = {
      type,
      timestamp: new Date(),
      data,
      metadata,
    }

    await this.emit(event)
  }

  /**
   * Clear all handlers (useful for testing)
   */
  reset(): void {
    this.handlers.clear()
    this.globalHandlers.clear()
  }

  /**
   * Get count of handlers for debugging
   */
  getHandlerCount(eventType?: string): number {
    if (eventType) {
      return (this.handlers.get(eventType)?.size || 0) + this.globalHandlers.size
    }
    return (
      Array.from(this.handlers.values()).reduce((sum, set) => sum + set.size, 0) +
      this.globalHandlers.size
    )
  }
}

// Export singleton instance
export const eventBus = new EventBus()

// ============================================================================
// Built-in Event Handlers
// ============================================================================

/**
 * Example: Log all events in development
 */
if (process.env.NODE_ENV === 'development' && process.env.LOG_EVENTS === 'true') {
  eventBus.onAll((event) => {
    logger.debug(`Event: ${event.type}`, {
      data: event.data,
      metadata: event.metadata,
    })
  })
}

/**
 * Helper to create typed event emitters
 */
export function createEventEmitter<T>(type: string) {
  return (data: T, metadata?: DomainEvent['metadata']) => {
    return eventBus.publish(type, data, metadata)
  }
}
