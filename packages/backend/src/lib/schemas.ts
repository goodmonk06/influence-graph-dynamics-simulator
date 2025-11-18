import { z } from 'zod'

// Node schemas
export const createNodeSchema = z.object({
  communityId: z.string(),
  memberId: z.string(),
  baseInfluenceScore: z.number().min(0).default(1.0),
  metaJson: z.record(z.any()).optional(),
})

export const updateNodeSchema = z.object({
  baseInfluenceScore: z.number().min(0).optional(),
  metaJson: z.record(z.any()).optional(),
})

// Edge schemas
export const createEdgeSchema = z.object({
  communityId: z.string(),
  fromNodeId: z.string(),
  toNodeId: z.string(),
  strength: z.number().min(0).max(1).default(0.5),
  relationType: z.enum(['friend', 'mentor', 'group_peer', 'other']).default('other'),
  metaJson: z.record(z.any()).optional(),
})

export const updateEdgeSchema = z.object({
  strength: z.number().min(0).max(1).optional(),
  relationType: z.enum(['friend', 'mentor', 'group_peer', 'other']).optional(),
  metaJson: z.record(z.any()).optional(),
})

// Scenario schemas
export const simulationParametersSchema = z.object({
  decayFactor: z.number().min(0).max(1).default(0.7),
  maxIterations: z.number().int().min(1).max(100).default(10),
  activationThreshold: z.number().min(0).max(1).default(0.5),
  allowReactivation: z.boolean().default(false),
})

export const createScenarioSchema = z.object({
  communityId: z.string(),
  name: z.string().min(1),
  descriptionMarkdown: z.string().optional(),
  initialSeedNodesJson: z.array(z.string()).min(1),
  parametersJson: simulationParametersSchema,
})

export const updateScenarioSchema = z.object({
  name: z.string().min(1).optional(),
  descriptionMarkdown: z.string().optional(),
  initialSeedNodesJson: z.array(z.string()).min(1).optional(),
  parametersJson: simulationParametersSchema.optional(),
})

export type CreateNodeInput = z.infer<typeof createNodeSchema>
export type UpdateNodeInput = z.infer<typeof updateNodeSchema>
export type CreateEdgeInput = z.infer<typeof createEdgeSchema>
export type UpdateEdgeInput = z.infer<typeof updateEdgeSchema>
export type CreateScenarioInput = z.infer<typeof createScenarioSchema>
export type UpdateScenarioInput = z.infer<typeof updateScenarioSchema>
export type SimulationParameters = z.infer<typeof simulationParametersSchema>
