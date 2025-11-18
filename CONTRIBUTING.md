# Contributing to Influence Graph Dynamics Simulator

Thank you for your interest in contributing to this project!

## Development Setup

1. Fork and clone the repository
2. Install dependencies: `pnpm install`
3. Start PostgreSQL: `pnpm docker:up`
4. Set up the database: `pnpm db:migrate && pnpm db:seed`
5. Start dev servers: `pnpm dev`

## Project Architecture

### Backend (`packages/backend`)
- **Simulation Engine** (`src/simulation/`): Core propagation logic, pure TypeScript
- **API Routes** (`src/routes/`): REST endpoints using Fastify
- **Services** (`src/services/`): Business logic layer
- **Database** (`prisma/`): Prisma schema and migrations

### Frontend (`packages/frontend`)
- **App Router** (`src/app/`): Next.js 14 pages
- **Components** (`src/components/`): Reusable React components
- **API Client** (`src/lib/api.ts`): Type-safe API calls

## Code Style

- Use TypeScript strict mode
- Follow ESLint and Prettier rules (run `pnpm lint`)
- Write tests for new features (especially simulation logic)
- Use meaningful variable and function names

## Testing

```bash
# Run all tests
pnpm test

# Run backend tests with coverage
cd packages/backend
pnpm test:coverage
```

## Adding New Features

### New Propagation Algorithm

1. Extend `PropagationEngine` in `packages/backend/src/simulation/propagation-engine.ts`
2. Add parameters to `SimulationParameters` type
3. Update Zod schemas in `packages/backend/src/lib/schemas.ts`
4. Write comprehensive unit tests
5. Update documentation

### New API Endpoints

1. Create route file in `packages/backend/src/routes/`
2. Register route in `packages/backend/src/index.ts`
3. Add corresponding API client methods in `packages/frontend/src/lib/api.ts`
4. Update TypeScript types

### New Visualization

1. Create component in `packages/frontend/src/components/`
2. Use D3.js for graph-based visualizations
3. Ensure responsive design with Tailwind CSS
4. Add loading and error states

## Commit Messages

Use conventional commits:
- `feat: add new feature`
- `fix: resolve bug`
- `docs: update documentation`
- `test: add tests`
- `refactor: code improvements`
- `chore: tooling and dependencies`

## Pull Requests

1. Create a feature branch: `git checkout -b feat/my-feature`
2. Make your changes with clear commits
3. Ensure tests pass: `pnpm test`
4. Update documentation if needed
5. Submit PR with description of changes

## Questions?

Feel free to open an issue for discussion!
