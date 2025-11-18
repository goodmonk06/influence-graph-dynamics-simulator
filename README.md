# Influence Graph Dynamics Simulator

A sophisticated influence dynamics simulator that models how messages and themes propagate through social networks. Built with Node.js, TypeScript, Fastify, PostgreSQL, and Next.js.

**メンバー間の影響度グラフをモデリングし、「誰の発信がどこまで届いているか」をシミュレーションするダイナミクスエンジン。**

## Overview

This simulator helps you understand and predict how information spreads through influence networks by:
- Modeling community members as nodes with influence weights
- Representing relationships as weighted, directed edges with different types
- Running discrete-time propagation simulations
- Visualizing propagation patterns with interactive force-directed graphs
- Testing "what-if" scenarios for campaign planning and broadcast strategies

## Theoretical Model

### Graph-Based Influence Network

The system models influence as a **directed, weighted graph**:

- **Nodes (InfluenceNode)**: Represent individuals in the network
  - `baseInfluenceScore`: The inherent influence level of a person (≥0)
  - Higher scores mean stronger ability to activate others

- **Edges (InfluenceEdge)**: Represent influence relationships
  - `strength`: Connection strength (0.0 to 1.0)
  - `relationType`: Type of relationship (friend, mentor, group_peer, other)
  - Direction matters: A→B means A can influence B

### Discrete-Time Propagation Model

The simulation runs in discrete time steps (iterations):

1. **Initialization (t=0)**
   - Seed nodes start as "active" with influence = baseInfluenceScore
   - All other nodes start inactive with influence = 0

2. **Propagation Step (t → t+1)**
   - Each active node propagates influence to neighbors
   - Transmitted influence = `sourceInfluence × edgeStrength × decayFactor`
   - Target nodes accumulate influence from all active neighbors
   - Nodes become active when accumulated influence ≥ `activationThreshold`

3. **Convergence**
   - Simulation stops when:
     - No new nodes activate (stable state reached)
     - Maximum iterations reached
     - All nodes are active (complete saturation)

### Parameters

- **decayFactor** (0.0-1.0): How much influence decays per hop
  - Higher = influence travels farther
  - Lower = influence dissipates quickly

- **activationThreshold** (0.0-1.0): Minimum influence needed to activate
  - Higher = harder to activate (more selective propagation)
  - Lower = easier to activate (broader spread)

- **maxIterations**: Maximum propagation steps
  - Prevents infinite loops
  - Typically 10-20 iterations sufficient for most networks

- **allowReactivation**: Whether already-active nodes can accumulate more influence
  - `false`: One-time activation (typical for message spreading)
  - `true`: Continuous accumulation (for ongoing campaigns)

## Features

### 1. Graph Modeling
- CRUD operations for nodes and edges
- Support for multiple communities
- Flexible metadata storage (JSON fields)
- Four relationship types: friend, mentor, group_peer, other

### 2. Simulation Engine
- Efficient discrete-time propagation algorithm
- Configurable parameters for different scenarios
- Multi-source seed support
- Iteration-by-iteration state tracking

### 3. REST API
- Node management: `GET/POST/PATCH/DELETE /api/nodes`
- Edge management: `GET/POST/PATCH/DELETE /api/edges`
- Scenario management: `GET/POST/PATCH/DELETE /api/scenarios`
- Run simulations: `POST /api/scenarios/:id/run`
- Retrieve results: `GET /api/scenarios/:id/results/latest`

### 4. Interactive UI
- Force-directed graph visualization with D3.js
- Scenario builder with parameter controls
- Animation through simulation iterations
- Real-time statistics and coverage metrics

### 5. Testing & Quality
- Comprehensive unit tests for propagation engine
- Type-safe TypeScript throughout
- Prisma for type-safe database access
- ESLint and Prettier for code quality

## Tech Stack

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Fastify 4.x
- **Language**: TypeScript 5.x
- **Database**: PostgreSQL 16
- **ORM**: Prisma 5.x
- **Validation**: Zod
- **Testing**: Vitest

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Visualization**: D3.js v7
- **State Management**: TanStack Query (React Query)
- **Styling**: Tailwind CSS
- **Language**: TypeScript 5.x

### DevOps
- **Package Manager**: pnpm (workspaces)
- **Build Tool**: Turbo (monorepo)
- **Containers**: Docker Compose

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker & Docker Compose

### Installation

1. **Clone and install dependencies**

```bash
git clone <repository-url>
cd influence-graph-dynamics-simulator
pnpm install
```

2. **Start PostgreSQL**

```bash
docker-compose up -d
```

3. **Set up the database**

```bash
# Copy environment variables
cp packages/backend/.env.example packages/backend/.env
cp packages/frontend/.env.example packages/frontend/.env

# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Seed with demo data
pnpm db:seed
```

4. **Start development servers**

```bash
# Start both backend and frontend
pnpm dev

# Backend will run on http://localhost:3001
# Frontend will run on http://localhost:3000
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run with coverage
cd packages/backend
pnpm test:coverage
```

## Usage Examples

### Scenario 1: Founder Announcement

**Question**: "If our founder posts an important announcement, how far will it reach?"

**Setup**:
- Seed: Alice (founder, baseInfluence = 2.5)
- Parameters: decayFactor = 0.7, threshold = 0.5

**Expected Result**:
- High reach due to strong mentor relationships
- 3-4 iterations to reach most active members
- New members may not be reached directly

### Scenario 2: Grassroots Movement

**Question**: "Can new members start a movement bottom-up?"

**Setup**:
- Seeds: 4 new members (baseInfluence = 0.5 each)
- Parameters: decayFactor = 0.75, threshold = 0.4

**Expected Result**:
- Limited reach due to low influence scores
- May stay within new member cluster
- Demonstrates challenge of bottom-up communication

### Scenario 3: Coordinated Campaign

**Question**: "What if community managers coordinate?"

**Setup**:
- Seeds: Bob + George (managers)
- Parameters: decayFactor = 0.65, threshold = 0.6

**Expected Result**:
- Broader reach through different network clusters
- Simultaneous activation in multiple areas
- Good coverage without high-influence founders

## API Examples

### Create a Node

```bash
curl -X POST http://localhost:3001/api/nodes \
  -H "Content-Type: application/json" \
  -d '{
    "communityId": "my-community",
    "memberId": "alice",
    "baseInfluenceScore": 2.5,
    "metaJson": {"role": "founder"}
  }'
```

### Create an Edge

```bash
curl -X POST http://localhost:3001/api/edges \
  -H "Content-Type: application/json" \
  -d '{
    "communityId": "my-community",
    "fromNodeId": "node-id-1",
    "toNodeId": "node-id-2",
    "strength": 0.8,
    "relationType": "mentor"
  }'
```

### Create and Run a Scenario

```bash
# Create scenario
curl -X POST http://localhost:3001/api/scenarios \
  -H "Content-Type: application/json" \
  -d '{
    "communityId": "my-community",
    "name": "Test Campaign",
    "initialSeedNodesJson": ["node-id-1"],
    "parametersJson": {
      "decayFactor": 0.7,
      "maxIterations": 10,
      "activationThreshold": 0.5,
      "allowReactivation": false
    }
  }'

# Run simulation
curl -X POST http://localhost:3001/api/scenarios/{scenario-id}/run

# Get results
curl http://localhost:3001/api/scenarios/{scenario-id}/results/latest
```

## Use Cases

### Campaign Design
- Test message reach before launching campaigns
- Identify optimal influencers to seed campaigns
- Predict coverage and iteration timing

### Broadcast Strategy
- Understand which members act as bridges between clusters
- Optimize announcement timing and sources
- Plan multi-phase rollout strategies

### Network Analysis
- Identify isolated members or clusters
- Measure effective influence vs. positional influence
- Detect bottlenecks in information flow

### Community Health
- Monitor how well information flows
- Identify members who need better connections
- Track influence distribution over time

## Project Structure

```
influence-graph-dynamics-simulator/
├── packages/
│   ├── backend/              # Fastify API server
│   │   ├── prisma/
│   │   │   ├── schema.prisma # Database schema
│   │   │   └── seed.ts       # Demo data
│   │   └── src/
│   │       ├── simulation/   # Propagation engine (core logic)
│   │       ├── routes/       # API endpoints
│   │       ├── services/     # Business logic
│   │       └── lib/          # Utilities
│   │
│   └── frontend/             # Next.js UI
│       └── src/
│           ├── app/          # Pages (App Router)
│           ├── components/   # React components
│           └── lib/          # API client
│
├── docker-compose.yml        # PostgreSQL setup
├── turbo.json               # Monorepo build config
└── package.json             # Workspace root
```

## Scripts

```bash
# Development
pnpm dev                 # Start all services
pnpm build              # Build all packages
pnpm test               # Run all tests

# Database
pnpm db:generate        # Generate Prisma client
pnpm db:migrate         # Run migrations
pnpm db:seed            # Seed demo data
pnpm db:studio          # Open Prisma Studio

# Docker
pnpm docker:up          # Start PostgreSQL
pnpm docker:down        # Stop PostgreSQL

# Cleanup
pnpm clean              # Remove build artifacts
```

## Contributing

This is a demonstration project showcasing influence dynamics simulation. Feel free to:
- Extend the propagation model with new algorithms
- Add visualization features
- Implement additional network metrics
- Create new relationship types

## License

MIT License - see LICENSE file for details

## Acknowledgments

Built with modern TypeScript best practices and production-ready tooling. The propagation model is inspired by epidemiological models and social network theory.