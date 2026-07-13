# ClaudeClaw Architecture

## System Overview

ClaudeClaw is a multi-agent orchestration system designed to coordinate specialized AI agents (Coordinator, Coder, Reviewer, Researcher) to solve complex tasks.

```
┌─────────────────────────────────────────────────────────┐
│                  ClaudeClaw CLI                         │
│        (Task Registration, Queue Management)            │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────┐
        │  ClaudeClawOrchestrator         │
        │  - Task Queue Management       │
        │  - Agent Coordination           │
        │  - State Tracking               │
        │  - Result Aggregation           │
        └────────────┬──────────┬─────────┘
                     │          │
        ┌────────────▼──────┐   │
        │  MiddlewareChain  │   │
        │  - Request/Response│   │
        │  - Error Handling │   │
        │  - Logging/Timing │   │
        └────────────┬──────┘   │
                     │          │
        ┌────────────▼──────────▼──────┐
        │      PluginManager            │
        │  - Plugin Loading/Unloading  │
        │  - Tool Registration          │
        │  - Skill Registration         │
        │  - Hook System                │
        └───────────────┬───────────────┘
                        │
        ┌───────────────▼──────────────────┐
        │    Agent Execution Engines       │
        ├────────────────────────────────┤
        │ - Coordinator Agent (Planning) │
        │ - Coder Agent (Implementation) │
        │ - Reviewer Agent (QA)          │
        │ - Researcher Agent (Analysis)  │
        └───────────────┬──────────────────┘
                        │
        ┌───────────────▼──────────────────┐
        │  Anthropic Claude API            │
        │  (claude-opus-4-1 or later)      │
        └────────────────────────────────┘
```

## Core Components

### 1. ClaudeClawOrchestrator

The central orchestration engine that manages:
- **Task Queue**: FIFO queue with priority levels
- **Agent Registration**: Maps agent IDs to configurations
- **Execution Flow**: Routes tasks to appropriate agents
- **State Management**: Tracks execution state and results

```typescript
public async executeTask(task: Task): Promise<AgentResult[]>
public async processQueue(): Promise<void>
public getState(): OrchestrationState
```

### 2. Agent System

Four specialized agent roles:

#### Coordinator
- **Purpose**: Plans and orchestrates task execution
- **Model**: Claude Opus 4.1 (configurable)
- **Responsibilities**: Strategy, task decomposition, prioritization

#### Coder
- **Purpose**: Generates and modifies code
- **Model**: Claude Opus 4.1 (configurable)
- **Responsibilities**: Implementation, refactoring, optimization

#### Reviewer
- **Purpose**: Reviews code quality and security
- **Model**: Claude Opus 4.1 (configurable)
- **Responsibilities**: Quality assurance, security scanning, best practices

#### Researcher
- **Purpose**: Finds and synthesizes information
- **Model**: Claude Opus 4.1 (configurable)
- **Responsibilities**: Research, analysis, data collection

### 3. Middleware Chain

Request/response interception system:

```
Task Input
    ▼
OnBeforeTaskExecution (all middlewares)
    ▼
Agent Execution
    ▼
OnAfterAgentExecution (all middlewares)
    ▼
Task Result Output
```

Built-in middleware:
- **LoggingMiddleware**: Structured logging of task lifecycle
- **TimingMiddleware**: Performance metrics collection

### 4. Plugin System

Extensible architecture for custom functionality:

```typescript
interface ClaudeClawPlugin {
  name: string
  version: string
  initialize(context: PluginContext): Promise<void>
  destroy?(): Promise<void>
}
```

Plugin capabilities:
- **Tool Registration**: Custom tools available to agents
- **Skill Registration**: Reusable skill definitions
- **Hook System**: Event-driven extensions
- **Configuration Access**: Plugin-specific config

### 5. MCP Integration

Integration layer for MCP (Model Context Protocol) servers:

```
ClaudeClaw
    ▼
MCPIntegration (HTTP/JSON-RPC bridge)
    ▼
┌─────────────────┬──────────────────┐
▼                 ▼                  ▼
Researcher MCP    Skills MCP      Custom MCPs
(LightRAG,        (Skill Tasks,   (Domain-specific)
Database Queries) Code Review)
```

### 6. Configuration Management

Centralized configuration with Zod validation:

```typescript
type Config = {
  orchestrator: {
    maxConcurrentAgents: number
    taskTimeoutMs: number
    retryAttempts: number
  }
  agents: {
    coordinator: { model: string, systemPrompt?: string }
    coder: { model: string, systemPrompt?: string }
    reviewer: { model: string, systemPrompt?: string }
    researcher: { model: string, systemPrompt?: string }
  }
  mcp: {
    researcher: { port: number, enabled: boolean }
    skills: { port: number, enabled: boolean }
  }
  logging: { level: string, format: string }
  codex: { enabled: boolean, apiKey?: string }
}
```

## Data Flow

### Task Execution Flow

```
1. Task Registration
   └─ CLI receives task definition
   └─ Task added to queue

2. Queue Processing
   └─ Orchestrator starts processing queue
   └─ For each task:
      └─ Middleware: onBeforeTaskExecution
      └─ For each required agent:
         └─ Middleware: onBeforeAgentExecution
         └─ Agent receives task
         └─ Agent calls Claude API
         └─ Result returned to orchestrator
         └─ Middleware: onAfterAgentExecution
      └─ Middleware: onAfterTaskExecution
      └─ Result stored in state

3. State Export
   └─ Orchestrator state exported to JSON
   └─ Results available for analysis
```

### Agent Communication Pattern

```
Agent
  │
  ├─ System Prompt (Role-specific)
  ├─ Task Description
  ├─ Tool/Skill Definitions (from PluginManager)
  └─ Previous Agent Results (if sequential)
  │
  ▼
Claude API
  │
  ▼
Response
  │
  ├─ Text Output
  ├─ Tool Calls (optional)
  └─ Structured Results
  │
  ▼
Orchestrator
  │
  ├─ Store Result
  ├─ Track Tokens Used
  └─ Update State
```

## Extension Points

### 1. Custom Plugins

Extend functionality by implementing the `ClaudeClawPlugin` interface:

```typescript
class MyCustomPlugin implements ClaudeClawPlugin {
  async initialize(context: PluginContext) {
    context.registerTool('my-tool', async (args) => {
      // Custom logic
    })
  }
}
```

### 2. Custom Middleware

Intercept task execution:

```typescript
class MyMiddleware implements Middleware {
  async onBeforeTaskExecution(task: Task): Promise<Task> {
    // Pre-processing logic
    return task
  }
  
  async onAfterTaskExecution(task: Task, results: AgentResult[]): Promise<void> {
    // Post-processing logic
  }
}
```

### 3. Custom Agent Roles

Define new agent types (future):

```typescript
registerAgent({
  id: 'my-agent',
  role: 'custom', // New role
  model: 'claude-opus-4-1'
})
```

## Performance Considerations

### Concurrency

- **Max Concurrent Agents**: Configurable (default: 4)
- **Task Timeout**: 300 seconds (default, configurable)
- **Retry Strategy**: Exponential backoff (default: 3 attempts)

### Caching

- **MCP Results**: Cached by tool + arguments
- **Plugin Tools**: Cached based on output configuration
- **Clear Cache**: Manual via `MCPIntegration.clearCache()`

### Token Usage

- **Tracking**: All agent calls record input/output tokens
- **Monitoring**: Available in execution state export
- **Budgeting**: Can be extended with rate limiting

## Security Architecture

### Input Validation

- **Task Schemas**: Validated with Zod
- **Agent Args**: Type-checked before execution
- **MCP Inputs**: Sanitized before calling external servers

### Error Handling

- **Graceful Degradation**: Failed agents don't block queue
- **Error Middleware**: Centralized error handling
- **Logging**: All errors logged with context

### Plugin Safety

- **Sandboxing**: Plugins run in same process (future: worker threads)
- **Permissions**: Plugin context has limited access to orchestrator internals
- **Audit Trail**: All plugin operations logged

## Monitoring & Observability

### Metrics

- Task execution time (via TimingMiddleware)
- Token usage per agent
- Success/failure rates
- Error distribution

### Logging

- Structured logging with Pino
- Log levels: debug, info, warn, error
- JSON format for parsing

### State Export

```json
{
  "taskQueue": [...],
  "activeAgents": {...},
  "results": [
    {
      "agentId": "coder",
      "taskId": "task-1",
      "output": "...",
      "success": true,
      "tokensUsed": { "input": 150, "output": 80 }
    }
  ],
  "startTime": "2024-01-15T10:30:00Z"
}
```

## Deployment Architecture

### Local Development

```
Your Machine
  └─ Node.js 18+
  └─ ClaudeClaw CLI
  └─ Optional: MCP servers (localhost:3001, 3002)
```

### Production (Future)

```
Docker Container
  └─ ClaudeClaw Server
  ├─ Researcher MCP Server
  ├─ Skills MCP Server
  └─ Codex Executor (optional)
```

## Scalability Path

1. **Current**: Single-process, synchronous task queue
2. **Phase 2**: Multi-process queue (Bull/RabbitMQ)
3. **Phase 3**: Distributed agents across multiple servers
4. **Phase 4**: Kubernetes deployment with auto-scaling

## Dependencies

- **@anthropic-ai/sdk**: Anthropic Claude API client
- **zod**: Schema validation
- **yargs**: CLI argument parsing
- **pino**: Logging
- **node-cache**: In-memory caching
- **typescript**: Language support
- **vitest**: Testing framework

## References

- [API Documentation](./API.md)
- [Plugin Development](./PLUGINS.md)
- [Deployment Guide](./DEPLOYMENT.md)
