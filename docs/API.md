# ClaudeClaw API Reference

## Table of Contents

1. [ClaudeClawOrchestrator](#claudeclawOrchestrator)
2. [Agents](#agents)
3. [Tasks](#tasks)
4. [Plugins](#plugins)
5. [Middleware](#middleware)
6. [MCP Integration](#mcp-integration)
7. [Configuration](#configuration)
8. [Types](#types)

---

## ClaudeClawOrchestrator

Main orchestration engine for coordinating agents.

### Constructor

```typescript
new ClaudeClawOrchestrator(apiKey?: string)
```

**Parameters:**
- `apiKey`: (optional) Anthropic API key. Defaults to `process.env.ANTHROPIC_API_KEY`

### Methods

#### registerAgent

Register a new agent with the orchestrator.

```typescript
public registerAgent(agent: Agent): void
```

**Parameters:**
- `agent`: Agent configuration object

**Example:**
```typescript
orchestrator.registerAgent({
  id: 'my-coder',
  role: 'coder',
  model: 'claude-opus-4-1'
})
```

#### addTask

Add a task to the execution queue.

```typescript
public addTask(task: Task): void
```

**Parameters:**
- `task`: Task definition

**Example:**
```typescript
orchestrator.addTask({
  id: 'task-1',
  title: 'Implement feature',
  description: 'Add new authentication module',
  requiredAgents: ['coordinator', 'coder', 'reviewer'],
  priority: 'high',
  status: 'pending',
  createdAt: new Date()
})
```

#### executeTask

Execute a specific task with all its required agents.

```typescript
public async executeTask(task: Task): Promise<AgentResult[]>
```

**Parameters:**
- `task`: Task to execute

**Returns:**
- Array of `AgentResult` objects

**Example:**
```typescript
const results = await orchestrator.executeTask(task)
results.forEach(result => {
  console.log(`${result.agentId}: ${result.output}`)
})
```

#### processQueue

Process all tasks in the queue sequentially.

```typescript
public async processQueue(): Promise<void>
```

**Example:**
```typescript
await orchestrator.processQueue()
console.log('All tasks completed')
```

#### getState

Get the current orchestration state.

```typescript
public getState(): OrchestrationState
```

**Returns:**
- Current `OrchestrationState`

**Example:**
```typescript
const state = orchestrator.getState()
console.log(`Completed tasks: ${state.results.length}`)
console.log(`Elapsed time: ${Date.now() - state.startTime.getTime()}ms`)
```

---

## Agents

Agent configuration and execution.

### Agent Interface

```typescript
interface Agent {
  id: string
  role: 'coordinator' | 'coder' | 'reviewer' | 'researcher'
  model: string
  systemPrompt?: string
  tools?: string[]
}
```

### Agent Roles

#### Coordinator

Plans task execution and orchestrates other agents.

- **Default Model**: claude-opus-4-1
- **Responsibilities**: Strategy, decomposition, prioritization

#### Coder

Generates and modifies code.

- **Default Model**: claude-opus-4-1
- **Responsibilities**: Implementation, refactoring, optimization

#### Reviewer

Reviews code quality and security.

- **Default Model**: claude-opus-4-1
- **Responsibilities**: Quality assurance, security, best practices

#### Researcher

Analyzes and researches information.

- **Default Model**: claude-opus-4-1
- **Responsibilities**: Analysis, research, data gathering

---

## Tasks

Task definition and execution.

### Task Interface

```typescript
interface Task {
  id: string
  title: string
  description: string
  requiredAgents: string[]
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  createdAt: Date
  completedAt?: Date
  result?: unknown
  error?: string
}
```

### AgentResult Interface

```typescript
interface AgentResult {
  agentId: string
  taskId: string
  output: string
  toolCalls?: ToolCall[]
  tokensUsed: {
    input: number
    output: number
  }
  success: boolean
  error?: string
}
```

### Status Transitions

```
pending → in_progress → completed (or failed)
```

---

## Plugins

Extend ClaudeClaw functionality with plugins.

### PluginManager

```typescript
class PluginManager {
  async loadPlugin(plugin: ClaudeClawPlugin): Promise<void>
  async unloadPlugin(name: string): Promise<void>
  async invokeHook(event: string, context: any): Promise<void>
  async invokeTool(name: string, args: Record<string, unknown>): Promise<any>
  listTools(): string[]
  listSkills(): SkillDefinition[]
  listPlugins(): Array<{ name: string; version: string }>
}
```

### ClaudeClawPlugin Interface

```typescript
interface ClaudeClawPlugin {
  name: string
  version: string
  initialize(context: PluginContext): Promise<void>
  destroy?(): Promise<void>
}
```

### PluginContext Interface

```typescript
interface PluginContext {
  registerTool(name: string, handler: ToolHandler): void
  registerHook(event: string, handler: HookHandler): void
  registerSkill(name: string, skill: SkillDefinition): void
  getConfig(): Record<string, any>
  logger: Logger
}
```

### Example: Creating a Plugin

```typescript
class MyPlugin implements ClaudeClawPlugin {
  name = 'my-plugin'
  version = '1.0.0'

  async initialize(context: PluginContext): Promise<void> {
    // Register tool
    context.registerTool('calculate', async (args: any) => {
      return { result: args.a + args.b }
    })

    // Register hook
    context.registerHook('task:start', async (taskContext) => {
      console.log('Task started:', taskContext.taskId)
    })

    // Register skill
    context.registerSkill('analyze', {
      name: 'analyze',
      description: 'Analyze data',
      handler: async (args: any) => {
        return JSON.stringify({ analyzed: true })
      }
    })
  }
}

// Usage
const manager = new PluginManager()
await manager.loadPlugin(new MyPlugin())
```

---

## Middleware

Request/response interception.

### MiddlewareChain

```typescript
class MiddlewareChain {
  register(middleware: Middleware): void
  unregister(name: string): void
  list(): string[]
  async executeBeforeTaskExecution(task: Task): Promise<Task>
  async executeAfterTaskExecution(task: Task, results: AgentResult[]): Promise<void>
  async executeBeforeAgentExecution(agent: Agent, task: Task): Promise<void>
  async executeAfterAgentExecution(agent: Agent, task: Task, result: AgentResult): Promise<AgentResult>
  async executeErrorHandler(error: Error, context: any): Promise<void>
}
```

### Middleware Interface

```typescript
interface Middleware {
  name: string
  onBeforeTaskExecution?(task: Task): Task | Promise<Task>
  onAfterTaskExecution?(task: Task, results: AgentResult[]): void | Promise<void>
  onBeforeAgentExecution?(agent: Agent, task: Task): void | Promise<void>
  onAfterAgentExecution?(agent: Agent, task: Task, result: AgentResult): AgentResult | Promise<AgentResult>
  onError?(error: Error, context: any): void | Promise<void>
}
```

### Built-in Middleware

#### LoggingMiddleware

Logs task and agent execution events.

```typescript
import { LoggingMiddleware } from '@fillslava/claudeclaw'

const chain = new MiddlewareChain()
chain.register(new LoggingMiddleware())
```

#### TimingMiddleware

Measures task and agent execution duration.

```typescript
import { TimingMiddleware } from '@fillslava/claudeclaw'

const chain = new MiddlewareChain()
chain.register(new TimingMiddleware())
```

### Custom Middleware Example

```typescript
class RateLimitMiddleware implements Middleware {
  name = 'rate-limit'
  private requestCount = 0
  private maxRequests = 10

  async onBeforeTaskExecution(task: Task): Promise<Task> {
    if (this.requestCount >= this.maxRequests) {
      throw new Error('Rate limit exceeded')
    }
    this.requestCount++
    return task
  }

  async onAfterTaskExecution(task: Task): Promise<void> {
    this.requestCount--
  }
}
```

---

## MCP Integration

Model Context Protocol server integration.

### MCPIntegration

```typescript
class MCPIntegration {
  registerServer(config: MCPServerConfig): void
  async callTool(
    serverName: string,
    toolName: string,
    args: Record<string, unknown>
  ): Promise<MCPToolResult>
  clearCache(): void
  getServerStatus(): Record<string, { enabled: boolean; port: number }>
}
```

### MCPServerConfig Interface

```typescript
interface MCPServerConfig {
  name: string
  port: number
  enabled: boolean
  baseUrl?: string
}
```

### Example: Using MCP

```typescript
const mcp = new MCPIntegration()

mcp.registerServer({
  name: 'researcher',
  port: 3001,
  enabled: true
})

const result = await mcp.callTool('researcher', 'search_schema', {
  query: 'users table'
})

console.log(result)
```

---

## Configuration

### ConfigManager

```typescript
class ConfigManager {
  constructor(configPath?: string)
  loadConfig(): Config
  saveConfig(): void
  get(): Config
  set(partial: Partial<Config>): void
  getAgent(role: string): AgentConfig
  getMCPConfig(): MCPConfig
  static createDefaultConfig(): Config
  static export(config: Config): string
}
```

### Config Schema

```typescript
interface Config {
  orchestrator: {
    maxConcurrentAgents: number
    taskTimeoutMs: number
    retryAttempts: number
  }
  agents: {
    coordinator: AgentConfig
    coder: AgentConfig
    reviewer: AgentConfig
    researcher: AgentConfig
  }
  mcp: {
    researcher: MCPServerConfig
    skills: MCPServerConfig
  }
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error'
    format: 'json' | 'pretty'
  }
  codex: {
    enabled: boolean
    apiKey?: string
    workingDirectory?: string
  }
}
```

### Example: Using ConfigManager

```typescript
import { ConfigManager } from '@fillslava/claudeclaw'

const manager = new ConfigManager()

// Get current config
const config = manager.get()
console.log(config.orchestrator.maxConcurrentAgents)

// Update config
manager.set({
  orchestrator: {
    maxConcurrentAgents: 8,
    taskTimeoutMs: 600000,
    retryAttempts: 5
  }
})

// Save to disk
manager.saveConfig()
```

---

## Types

### OrchestrationState

```typescript
interface OrchestrationState {
  taskQueue: Task[]
  activeAgents: Map<string, Agent>
  results: AgentResult[]
  startTime: Date
}
```

### ToolCall

```typescript
interface ToolCall {
  name: string
  args: Record<string, unknown>
  result?: unknown
}
```

### MCPToolResult

```typescript
interface MCPToolResult {
  content: {
    type: 'text'
    text: string
  }[]
}
```

### CodexPatchRequest

```typescript
interface CodexPatchRequest {
  taskId: string
  fileContext: Map<string, string>
  taskSpec: string
  retryFeedback?: string
}
```

### CodexPatchResponse

```typescript
interface CodexPatchResponse {
  taskId: string
  patch: string
  explanation: string
  tokensUsed: {
    input: number
    output: number
  }
}
```

---

## CLI Reference

### Commands

```bash
# Register an agent
npm start agent:register <id> <role> <model>

# Add a task to the queue
npm start task:add <title> [options]
  --description <text>
  --agents <comma,separated,list>
  --priority <low|medium|high|critical>

# Process the task queue
npm start queue:process

# Export orchestration state
npm start state:export <filename>

# Show help
npm start -- --help
```

---

## Error Handling

### Common Errors

#### Agent Not Found

```
Error: Agent not found: <agentId>
```

**Solution**: Register the agent before using it

```typescript
orchestrator.registerAgent({...})
```

#### MCP Server Disabled

```
Error: MCP server disabled: <serverName>
```

**Solution**: Enable the server in config or start the MCP server

```json
{
  "mcp": {
    "researcher": {
      "enabled": true
    }
  }
}
```

#### API Key Missing

```
Error: ANTHROPIC_API_KEY not set
```

**Solution**: Set the environment variable

```bash
export ANTHROPIC_API_KEY=sk-...
```

---

## Performance Tips

1. **Batch Tasks**: Add multiple tasks before processing queue
2. **Configure Concurrency**: Adjust `maxConcurrentAgents` based on API limits
3. **Cache MCP Results**: Reuse similar queries to avoid redundant API calls
4. **Monitor Tokens**: Export state regularly to track API usage
5. **Use Appropriate Models**: Match agent model to task complexity

---

## Examples

### Complete Workflow

```typescript
import { ClaudeClawOrchestrator, Agent, Task } from '@fillslava/claudeclaw'

// Initialize
const orchestrator = new ClaudeClawOrchestrator()

// Register agents
const agents: Agent[] = [
  { id: 'coordinator', role: 'coordinator', model: 'claude-opus-4-1' },
  { id: 'coder', role: 'coder', model: 'claude-opus-4-1' },
  { id: 'reviewer', role: 'reviewer', model: 'claude-opus-4-1' }
]

agents.forEach(agent => orchestrator.registerAgent(agent))

// Create task
const task: Task = {
  id: 'task-1',
  title: 'Build API',
  description: 'Create a REST API with authentication',
  requiredAgents: ['coordinator', 'coder', 'reviewer'],
  priority: 'high',
  status: 'pending',
  createdAt: new Date()
}

// Execute
orchestrator.addTask(task)
await orchestrator.processQueue()

// Analyze results
const state = orchestrator.getState()
console.log(`Completed: ${state.results.length} results`)
console.log(`Duration: ${Date.now() - state.startTime.getTime()}ms`)

// Export
const fs = require('fs')
fs.writeFileSync('results.json', JSON.stringify(state, null, 2))
```

---

For more information, see:
- [Architecture Documentation](./ARCHITECTURE.md)
- [Getting Started Guide](../GETTING_STARTED.md)
- [Plugin Development Guide](./PLUGINS.md)
