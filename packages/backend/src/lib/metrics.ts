/**
 * Metrics collection abstraction
 * In production, integrate with Prometheus, Datadog, CloudWatch, etc.
 */

export interface MetricLabels {
  [key: string]: string | number
}

export interface Histogram {
  labels: MetricLabels
  value: number
  timestamp: Date
}

export interface Counter {
  labels: MetricLabels
  value: number
}

export interface Gauge {
  labels: MetricLabels
  value: number
}

class MetricsCollector {
  private counters: Map<string, Counter> = new Map()
  private gauges: Map<string, Gauge> = new Map()
  private histograms: Histogram[] = []

  /**
   * Increment a counter metric
   */
  incrementCounter(name: string, labels: MetricLabels = {}, value: number = 1): void {
    const key = this.getKey(name, labels)
    const existing = this.counters.get(key)

    if (existing) {
      existing.value += value
    } else {
      this.counters.set(key, { labels, value })
    }

    this.emit('counter', name, { ...labels, value })
  }

  /**
   * Set a gauge metric (current value)
   */
  setGauge(name: string, value: number, labels: MetricLabels = {}): void {
    const key = this.getKey(name, labels)
    this.gauges.set(key, { labels, value })
    this.emit('gauge', name, { ...labels, value })
  }

  /**
   * Record a histogram value (timing, size, etc.)
   */
  recordHistogram(name: string, value: number, labels: MetricLabels = {}): void {
    this.histograms.push({
      labels,
      value,
      timestamp: new Date(),
    })

    // Keep only last 1000 histogram entries in memory
    if (this.histograms.length > 1000) {
      this.histograms = this.histograms.slice(-1000)
    }

    this.emit('histogram', name, { ...labels, value })
  }

  /**
   * Record function execution time
   */
  async time<T>(
    name: string,
    fn: () => Promise<T>,
    labels: MetricLabels = {}
  ): Promise<T> {
    const start = Date.now()
    try {
      const result = await fn()
      const duration = Date.now() - start
      this.recordHistogram(`${name}_duration_ms`, duration, labels)
      return result
    } catch (error) {
      const duration = Date.now() - start
      this.recordHistogram(`${name}_duration_ms`, duration, { ...labels, error: 'true' })
      throw error
    }
  }

  /**
   * Get current counter value
   */
  getCounter(name: string, labels: MetricLabels = {}): number {
    const key = this.getKey(name, labels)
    return this.counters.get(key)?.value || 0
  }

  /**
   * Get current gauge value
   */
  getGauge(name: string, labels: MetricLabels = {}): number | undefined {
    const key = this.getKey(name, labels)
    return this.gauges.get(key)?.value
  }

  /**
   * Get histogram statistics
   */
  getHistogramStats(name: string, labels: MetricLabels = {}): {
    count: number
    avg: number
    min: number
    max: number
    p50: number
    p95: number
    p99: number
  } | null {
    const filtered = this.histograms.filter(
      (h) =>
        Object.entries(labels).every(
          ([key, value]) => h.labels[key] === value
        )
    )

    if (filtered.length === 0) return null

    const values = filtered.map((h) => h.value).sort((a, b) => a - b)
    const sum = values.reduce((acc, v) => acc + v, 0)

    return {
      count: values.length,
      avg: sum / values.length,
      min: values[0],
      max: values[values.length - 1],
      p50: values[Math.floor(values.length * 0.5)],
      p95: values[Math.floor(values.length * 0.95)],
      p99: values[Math.floor(values.length * 0.99)],
    }
  }

  /**
   * Clear all metrics
   */
  reset(): void {
    this.counters.clear()
    this.gauges.clear()
    this.histograms = []
  }

  private getKey(name: string, labels: MetricLabels): string {
    const sortedLabels = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join(',')
    return `${name}{${sortedLabels}}`
  }

  private emit(type: string, name: string, data: MetricLabels): void {
    // In production, emit to metrics backend
    // For development, just log in debug mode
    if (process.env.METRICS_DEBUG === 'true') {
      console.log(`[METRIC:${type}] ${name}`, data)
    }
  }
}

// Export singleton instance
export const metrics = new MetricsCollector()

// Common metric names as constants
export const METRICS = {
  // API metrics
  API_REQUEST_COUNT: 'api_request_count',
  API_REQUEST_DURATION: 'api_request_duration',
  API_ERROR_COUNT: 'api_error_count',

  // Simulation metrics
  SIMULATION_COUNT: 'simulation_count',
  SIMULATION_DURATION: 'simulation_duration',
  SIMULATION_GRAPH_SIZE: 'simulation_graph_size',
  SIMULATION_ITERATIONS: 'simulation_iterations',
  SIMULATION_ACTIVE_NODES: 'simulation_active_nodes',

  // Database metrics
  DB_QUERY_COUNT: 'db_query_count',
  DB_QUERY_DURATION: 'db_query_duration',

  // Cache metrics
  CACHE_HIT_COUNT: 'cache_hit_count',
  CACHE_MISS_COUNT: 'cache_miss_count',

  // Business metrics
  COMMUNITY_COUNT: 'community_count',
  SCENARIO_COUNT: 'scenario_count',
  NODE_COUNT: 'node_count',
  EDGE_COUNT: 'edge_count',
} as const
