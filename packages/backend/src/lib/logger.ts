/**
 * Structured logging utility with context support
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogContext {
  requestId?: string
  userId?: string
  communityId?: string
  scenarioId?: string
  [key: string]: any
}

export interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: LogContext
  error?: {
    name: string
    message: string
    stack?: string
  }
}

class Logger {
  private context: LogContext = {}
  private minLevel: LogLevel

  constructor() {
    const envLevel = process.env.LOG_LEVEL || 'info'
    this.minLevel = envLevel as LogLevel
  }

  /**
   * Create a child logger with additional context
   */
  child(context: LogContext): Logger {
    const childLogger = new Logger()
    childLogger.context = { ...this.context, ...context }
    childLogger.minLevel = this.minLevel
    return childLogger
  }

  /**
   * Add context to this logger instance
   */
  withContext(context: LogContext): Logger {
    this.context = { ...this.context, ...context }
    return this
  }

  debug(message: string, meta?: Record<string, any>): void {
    this.log('debug', message, meta)
  }

  info(message: string, meta?: Record<string, any>): void {
    this.log('info', message, meta)
  }

  warn(message: string, meta?: Record<string, any>): void {
    this.log('warn', message, meta)
  }

  error(message: string, error?: Error | unknown, meta?: Record<string, any>): void {
    const errorData =
      error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : undefined

    this.log('error', message, { ...meta, error: errorData })
  }

  private log(level: LogLevel, message: string, meta?: Record<string, any>): void {
    if (!this.shouldLog(level)) return

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: { ...this.context, ...meta },
    }

    if (meta?.error) {
      entry.error = meta.error
    }

    // In production, you'd send to a logging service
    // For now, we'll use console with color coding
    this.output(entry)
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error']
    const minIndex = levels.indexOf(this.minLevel)
    const currentIndex = levels.indexOf(level)
    return currentIndex >= minIndex
  }

  private output(entry: LogEntry): void {
    const isDev = process.env.NODE_ENV !== 'production'

    if (isDev) {
      // Pretty console output for development
      const colors = {
        debug: '\x1b[36m', // Cyan
        info: '\x1b[32m', // Green
        warn: '\x1b[33m', // Yellow
        error: '\x1b[31m', // Red
      }
      const reset = '\x1b[0m'
      const color = colors[entry.level]

      console.log(
        `${color}[${entry.level.toUpperCase()}]${reset} ${entry.timestamp} - ${entry.message}`,
        entry.context && Object.keys(entry.context).length > 0 ? entry.context : ''
      )

      if (entry.error) {
        console.error(`${color}Error:${reset}`, entry.error)
      }
    } else {
      // JSON output for production (easy to parse by log aggregators)
      console.log(JSON.stringify(entry))
    }
  }
}

// Export singleton instance
export const logger = new Logger()

// Export factory for creating child loggers
export const createLogger = (context: LogContext): Logger => {
  return logger.child(context)
}
