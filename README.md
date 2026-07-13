# ClaudeClaw

Multi-agent orchestration system for Claude Code + Anthropic agents.

## Architecture

ClaudeClaw coordinates multiple specialized agents (Coordinator, Coder, Reviewer, Researcher) to solve complex tasks through a task queue and dependency graph system.

```
┌─────────────────────────────────────────┐
│     ClaudeClaw Orchestrator             │
├─────────────────────────────────────────┤
│  Task Queue → Agent Router → Results    │
└─────────────────────────────────────────┘
         ↓              ↓              ↓
    ┌────────┐   ┌────────┐   ┌────────┐
    │ Coder  │   │Reviewer│   │Researcher
    │ Agent  │   │ Agent  │   │ Agent
    └────────┘   └────────┘   └────────┘
         ↓              ↓              ↓
    ┌─────────────────────────────────────┐
    │    Anthropic Claude API             │
    └─────────────────────────────────────┘
         ↓              ↓              ↓
    ┌────────┐   ┌────────┐   ┌────────┐
    │ Codex  │   │ Researcher │ Skills │
    │Executor│   │ MCP Server │ MCP    │
    └────────┘   └────────┘   └────────┘
```

## Features

- **Task Queue Management**: FIFO queue with priority levels
- **Multi-Agent Coordination**: Coordinator, Coder, Reviewer, Researcher roles
- **MCP Integration**: Researcher and Skills MCP servers
- **Codex Executor**: Unified diff patch generation and application
- **State Tracking**: Full execution state export and analysis
- **Logging**: Structured logging with Pino

## Installation

```bash
npm install
npm run build
```

## Usage

### Register an Agent

```bash
npm start agent:register coordinator coordinator claude-opus-4-1
npm start agent:register coder coder claude-opus-4-1
npm start agent:register reviewer reviewer claude-opus-4-1
npm start agent:register researcher researcher claude-opus-4-1
```

### Add a Task

```bash
npm start task:add "Implement feature X" \
  --description "Build the feature with tests" \
  --agents "coordinator,coder,reviewer" \
  --priority high
```

### Process Queue

```bash
npm start queue:process
```

### Export State

```bash
npm start state:export execution-state.json
```

## Configuration

Create `.env` file (see `.env.example`):

```env
ANTHROPIC_API_KEY=sk-...
LOG_LEVEL=info
RESEARCHER_MCP_PORT=3001
SKILLS_MCP_PORT=3002
```

## Development

```bash
npm run dev          # Watch mode
npm run build        # Build TypeScript
npm run type-check   # Type checking
npm run lint         # ESLint
npm run test         # Run tests
```

## Project Structure

```
src/
  ├── cli.ts                  # CLI interface
  ├── orchestrator.ts         # Core orchestration engine
  ├── types.ts               # TypeScript type definitions
  ├── codex/
  │   └── executor.ts        # Codex patch executor
  └── mcp-servers/
      ├── researcher-mcp.ts  # Researcher MCP server
      └── skills-mcp.ts      # Skills MCP server
```

## Key Components

### ClaudeClawOrchestrator
Main orchestration engine that:
- Manages agent registration
- Queues tasks
- Routes tasks to appropriate agents
- Tracks execution state and results

### Agent Roles
- **Coordinator**: Plans task execution strategy
- **Coder**: Generates and modifies code
- **Reviewer**: Reviews code quality and security
- **Researcher**: Finds and synthesizes information

### MCP Servers
- **Researcher MCP**: LightRAG integration, database queries, schema introspection
- **Skills MCP**: Task graph generation, code review, test running

### Codex Executor
Handles:
- Patch generation from task specifications
- Verification (typecheck, tests, linting)
- Retry logic with failure feedback

## Example Workflow

```bash
# 1. Build the project
npm run build

# 2. Register agents
npm start agent:register coordinator coordinator claude-opus-4-1
npm start agent:register coder coder claude-opus-4-1
npm start agent:register reviewer reviewer claude-opus-4-1

# 3. Add tasks
npm start task:add "Write a TypeScript utility" \
  --description "Create a utility module with tests" \
  --agents "coder,reviewer" \
  --priority high

# 4. Process the queue
npm start queue:process

# 5. Export results
npm start state:export results.json
```

## Next Steps

- [ ] Implement LightRAG integration for Researcher MCP
- [ ] Connect to actual database for Researcher MCP queries
- [ ] Implement Codex API integration for patch generation
- [ ] Add task dependency resolution
- [ ] Implement cost tracking and budgeting
- [ ] Add monitoring and metrics collection
- [ ] Support for retry strategies
- [ ] Webhook integration for external systems

## License

MIT
