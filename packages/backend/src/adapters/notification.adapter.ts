/**
 * Adapter interface for sending notifications
 * Integrate with email, SMS, webhooks, etc.
 */

export interface NotificationPayload {
  to: string | string[] // email, phone, webhook URL, etc.
  subject?: string
  message: string
  data?: Record<string, any>
  priority?: 'low' | 'normal' | 'high'
}

export interface NotificationResult {
  success: boolean
  messageId?: string
  error?: string
}

export interface INotificationProvider {
  /**
   * Provider identifier
   */
  readonly id: string

  /**
   * Provider name
   */
  readonly name: string

  /**
   * Send a notification
   */
  send(payload: NotificationPayload): Promise<NotificationResult>

  /**
   * Check if provider is configured and ready
   */
  isConfigured(): boolean
}

/**
 * No-op notification provider (default)
 */
export class ConsoleNotificationProvider implements INotificationProvider {
  readonly id = 'console'
  readonly name = 'Console Logger'

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    console.log('[NOTIFICATION]', payload)
    return {
      success: true,
      messageId: `console-${Date.now()}`,
    }
  }

  isConfigured(): boolean {
    return true
  }
}

/**
 * Notification provider registry
 */
class NotificationProviderRegistry {
  private providers: Map<string, INotificationProvider> = new Map()
  private defaultProviderId: string | null = null

  constructor() {
    // Register console provider as default
    const consoleProvider = new ConsoleNotificationProvider()
    this.register(consoleProvider, true)
  }

  register(provider: INotificationProvider, setAsDefault: boolean = false): void {
    this.providers.set(provider.id, provider)
    if (setAsDefault || this.defaultProviderId === null) {
      this.defaultProviderId = provider.id
    }
  }

  get(id: string): INotificationProvider | undefined {
    return this.providers.get(id)
  }

  getDefault(): INotificationProvider {
    if (!this.defaultProviderId) {
      throw new Error('No default notification provider registered')
    }
    const provider = this.providers.get(this.defaultProviderId)
    if (!provider) {
      throw new Error(`Default provider '${this.defaultProviderId}' not found`)
    }
    return provider
  }

  list(): INotificationProvider[] {
    return Array.from(this.providers.values())
  }
}

export const notificationProviderRegistry = new NotificationProviderRegistry()

/**
 * Helper function to send notifications
 */
export async function sendNotification(
  payload: NotificationPayload,
  providerId?: string
): Promise<NotificationResult> {
  const provider = providerId
    ? notificationProviderRegistry.get(providerId)
    : notificationProviderRegistry.getDefault()

  if (!provider) {
    throw new Error(`Notification provider '${providerId}' not found`)
  }

  if (!provider.isConfigured()) {
    return {
      success: false,
      error: `Provider '${provider.id}' is not configured`,
    }
  }

  return provider.send(payload)
}
