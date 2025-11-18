/**
 * Adapter interface for importing graph data from external sources
 */

export interface ImportedNode {
  externalId: string
  memberId: string
  baseInfluenceScore?: number
  metadata?: Record<string, any>
}

export interface ImportedEdge {
  fromExternalId: string
  toExternalId: string
  strength?: number
  relationType?: 'friend' | 'mentor' | 'group_peer' | 'other'
  metadata?: Record<string, any>
}

export interface ImportResult {
  success: boolean
  nodeCount: number
  edgeCount: number
  errors: string[]
  idMapping?: Map<string, string> // externalId -> nodeId
}

export interface IDataImporter {
  /**
   * Importer identifier
   */
  readonly id: string

  /**
   * Importer name
   */
  readonly name: string

  /**
   * Description of data source
   */
  readonly description: string

  /**
   * Import graph data
   */
  import(communityId: string, config: Record<string, any>): Promise<ImportResult>

  /**
   * Validate configuration
   */
  validateConfig(config: Record<string, any>): string[] | undefined

  /**
   * Check if importer is configured
   */
  isConfigured(): boolean
}

/**
 * CSV file importer (example implementation)
 */
export class CSVDataImporter implements IDataImporter {
  readonly id = 'csv'
  readonly name = 'CSV File Importer'
  readonly description = 'Import graph data from CSV files'

  async import(communityId: string, config: Record<string, any>): Promise<ImportResult> {
    // This is a stub - implement actual CSV parsing
    return {
      success: false,
      nodeCount: 0,
      edgeCount: 0,
      errors: ['CSV import not yet implemented'],
    }
  }

  validateConfig(config: Record<string, any>): string[] | undefined {
    const errors: string[] = []
    if (!config.nodesFile) {
      errors.push('nodesFile is required')
    }
    if (!config.edgesFile) {
      errors.push('edgesFile is required')
    }
    return errors.length > 0 ? errors : undefined
  }

  isConfigured(): boolean {
    return true
  }
}

/**
 * Data importer registry
 */
class DataImporterRegistry {
  private importers: Map<string, IDataImporter> = new Map()

  constructor() {
    // Register CSV importer
    this.register(new CSVDataImporter())
  }

  register(importer: IDataImporter): void {
    this.importers.set(importer.id, importer)
  }

  get(id: string): IDataImporter | undefined {
    return this.importers.get(id)
  }

  list(): IDataImporter[] {
    return Array.from(this.importers.values())
  }
}

export const dataImporterRegistry = new DataImporterRegistry()
