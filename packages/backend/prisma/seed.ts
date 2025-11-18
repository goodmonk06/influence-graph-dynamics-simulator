import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  const communityId = 'demo-community-001'

  // Clean up existing data for this community
  await prisma.propagationResult.deleteMany({
    where: {
      scenario: { communityId },
    },
  })
  await prisma.propagationScenario.deleteMany({ where: { communityId } })
  await prisma.influenceEdge.deleteMany({ where: { communityId } })
  await prisma.influenceNode.deleteMany({ where: { communityId } })

  console.log('📝 Creating influence nodes...')

  // Create 20 members with varying influence scores
  const members = [
    { id: 'alice', score: 2.5, role: 'Founder & thought leader' },
    { id: 'bob', score: 2.0, role: 'Community manager' },
    { id: 'charlie', score: 1.8, role: 'Popular contributor' },
    { id: 'diana', score: 1.5, role: 'Active mentor' },
    { id: 'evan', score: 1.5, role: 'Technical expert' },
    { id: 'fiona', score: 1.2, role: 'Regular contributor' },
    { id: 'george', score: 1.2, role: 'Event organizer' },
    { id: 'hannah', score: 1.0, role: 'Active member' },
    { id: 'ivan', score: 1.0, role: 'Active member' },
    { id: 'julia', score: 1.0, role: 'Active member' },
    { id: 'kevin', score: 0.8, role: 'Regular participant' },
    { id: 'laura', score: 0.8, role: 'Regular participant' },
    { id: 'mike', score: 0.8, role: 'Regular participant' },
    { id: 'nina', score: 0.6, role: 'Occasional member' },
    { id: 'oliver', score: 0.6, role: 'Occasional member' },
    { id: 'paula', score: 0.6, role: 'Occasional member' },
    { id: 'quinn', score: 0.5, role: 'New member' },
    { id: 'rachel', score: 0.5, role: 'New member' },
    { id: 'steve', score: 0.5, role: 'New member' },
    { id: 'tina', score: 0.5, role: 'New member' },
  ]

  const nodes = await Promise.all(
    members.map((member) =>
      prisma.influenceNode.create({
        data: {
          communityId,
          memberId: member.id,
          baseInfluenceScore: member.score,
          metaJson: { role: member.role },
        },
      })
    )
  )

  const nodeMap = new Map(nodes.map((n) => [n.memberId, n.id]))

  console.log('🔗 Creating influence edges...')

  // Define relationships with different types and strengths
  const relationships: Array<{
    from: string
    to: string
    type: 'friend' | 'mentor' | 'group_peer' | 'other'
    strength: number
  }> = [
    // Alice (founder) mentors and connects with many
    { from: 'alice', to: 'bob', type: 'mentor', strength: 0.9 },
    { from: 'alice', to: 'charlie', type: 'mentor', strength: 0.8 },
    { from: 'alice', to: 'diana', type: 'friend', strength: 0.85 },
    { from: 'alice', to: 'evan', type: 'friend', strength: 0.8 },

    // Bob (manager) has wide connections
    { from: 'bob', to: 'fiona', type: 'mentor', strength: 0.7 },
    { from: 'bob', to: 'george', type: 'group_peer', strength: 0.75 },
    { from: 'bob', to: 'hannah', type: 'group_peer', strength: 0.7 },
    { from: 'bob', to: 'ivan', type: 'other', strength: 0.6 },

    // Charlie is well-connected
    { from: 'charlie', to: 'evan', type: 'friend', strength: 0.8 },
    { from: 'charlie', to: 'fiona', type: 'friend', strength: 0.75 },
    { from: 'charlie', to: 'julia', type: 'group_peer', strength: 0.7 },
    { from: 'charlie', to: 'kevin', type: 'other', strength: 0.6 },

    // Diana mentors newcomers
    { from: 'diana', to: 'hannah', type: 'mentor', strength: 0.85 },
    { from: 'diana', to: 'julia', type: 'mentor', strength: 0.8 },
    { from: 'diana', to: 'laura', type: 'mentor', strength: 0.75 },

    // Evan (expert) influences technical folks
    { from: 'evan', to: 'george', type: 'friend', strength: 0.7 },
    { from: 'evan', to: 'mike', type: 'other', strength: 0.65 },
    { from: 'evan', to: 'kevin', type: 'other', strength: 0.6 },

    // Mid-level connections
    { from: 'fiona', to: 'hannah', type: 'friend', strength: 0.8 },
    { from: 'fiona', to: 'laura', type: 'friend', strength: 0.75 },
    { from: 'george', to: 'ivan', type: 'group_peer', strength: 0.7 },
    { from: 'george', to: 'mike', type: 'group_peer', strength: 0.7 },
    { from: 'hannah', to: 'nina', type: 'friend', strength: 0.7 },
    { from: 'ivan', to: 'oliver', type: 'friend', strength: 0.65 },
    { from: 'julia', to: 'kevin', type: 'friend', strength: 0.7 },

    // Lower-level connections forming clusters
    { from: 'kevin', to: 'laura', type: 'group_peer', strength: 0.6 },
    { from: 'laura', to: 'mike', type: 'friend', strength: 0.7 },
    { from: 'mike', to: 'nina', type: 'other', strength: 0.5 },
    { from: 'nina', to: 'oliver', type: 'friend', strength: 0.6 },
    { from: 'oliver', to: 'paula', type: 'friend', strength: 0.65 },
    { from: 'paula', to: 'quinn', type: 'other', strength: 0.5 },

    // New members forming a small cluster
    { from: 'quinn', to: 'rachel', type: 'friend', strength: 0.7 },
    { from: 'rachel', to: 'steve', type: 'friend', strength: 0.65 },
    { from: 'steve', to: 'tina', type: 'friend', strength: 0.6 },
    { from: 'tina', to: 'quinn', type: 'friend', strength: 0.55 },

    // Some connections from active members to new members
    { from: 'hannah', to: 'quinn', type: 'mentor', strength: 0.7 },
    { from: 'julia', to: 'rachel', type: 'other', strength: 0.5 },
    { from: 'kevin', to: 'steve', type: 'other', strength: 0.45 },
  ]

  await Promise.all(
    relationships.map((rel) =>
      prisma.influenceEdge.create({
        data: {
          communityId,
          fromNodeId: nodeMap.get(rel.from)!,
          toNodeId: nodeMap.get(rel.to)!,
          strength: rel.strength,
          relationType: rel.type,
        },
      })
    )
  )

  console.log('🎯 Creating demo scenarios...')

  // Scenario 1: Single influencer (Alice)
  await prisma.propagationScenario.create({
    data: {
      communityId,
      name: 'Founder Announcement',
      descriptionMarkdown: `
# Founder Announcement Scenario

Simulates what happens when Alice (the founder) makes an important announcement.

**Expected outcome**: Message should spread widely through mentor relationships and reach most active members within 3-4 iterations.
      `.trim(),
      initialSeedNodesJson: [nodeMap.get('alice')!],
      parametersJson: {
        decayFactor: 0.7,
        maxIterations: 10,
        activationThreshold: 0.5,
        allowReactivation: false,
      },
    },
  })

  // Scenario 2: Community managers campaign
  await prisma.propagationScenario.create({
    data: {
      communityId,
      name: 'Manager Campaign',
      descriptionMarkdown: `
# Community Manager Campaign

Bob and George coordinate to spread information through their networks.

**Expected outcome**: Should reach different clusters of the community simultaneously.
      `.trim(),
      initialSeedNodesJson: [nodeMap.get('bob')!, nodeMap.get('george')!],
      parametersJson: {
        decayFactor: 0.65,
        maxIterations: 10,
        activationThreshold: 0.6,
        allowReactivation: false,
      },
    },
  })

  // Scenario 3: Grassroots from new members
  await prisma.propagationScenario.create({
    data: {
      communityId,
      name: 'Grassroots Movement',
      descriptionMarkdown: `
# Grassroots Movement

What happens when new members (Quinn, Rachel, Steve, Tina) try to spread a message?

**Expected outcome**: Limited reach due to low influence scores and weaker connections. Demonstrates the challenge of bottom-up communication.
      `.trim(),
      initialSeedNodesJson: [
        nodeMap.get('quinn')!,
        nodeMap.get('rachel')!,
        nodeMap.get('steve')!,
        nodeMap.get('tina')!,
      ],
      parametersJson: {
        decayFactor: 0.75,
        maxIterations: 15,
        activationThreshold: 0.4,
        allowReactivation: false,
      },
    },
  })

  // Scenario 4: High threshold test
  await prisma.propagationScenario.create({
    data: {
      communityId,
      name: 'Hard-to-Activate Campaign',
      descriptionMarkdown: `
# High Activation Threshold Test

Tests propagation with a high activation threshold (0.8), requiring strong influence paths.

**Expected outcome**: Only nodes with strong connections to Alice will activate.
      `.trim(),
      initialSeedNodesJson: [nodeMap.get('alice')!],
      parametersJson: {
        decayFactor: 0.8,
        maxIterations: 10,
        activationThreshold: 0.8,
        allowReactivation: false,
      },
    },
  })

  console.log('✅ Seeding complete!')
  console.log(`   - Created ${nodes.length} influence nodes`)
  console.log(`   - Created ${relationships.length} influence edges`)
  console.log('   - Created 4 demo scenarios')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
