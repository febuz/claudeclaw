# Getting Started with ClaudeClaw

A complete guide to get up and running with ClaudeClaw's multi-agent orchestration system.

## Installation

```bash
git clone https://github.com/febuz/claudeclaw.git
cd claudeclaw
npm install
npm run build
```

## Quick Start

### 1. Set up environment variables

```bash
cp .env.example .env
# Edit .env with your API keys
```

### 2. Initialize agents

```bash
npm start agent:register coordinator coordinator claude-opus-4-1
npm start agent:register coder coder claude-opus-4-1
npm start agent:register reviewer reviewer claude-opus-4-1
npm start agent:register researcher researcher claude-opus-4-1
```

### 3. Add a task

```bash
npm start task:add "Implement a TypeScript utility" \
  --description "Create a reusable utility function with comprehensive tests" \
  --agents "coordinator,coder,reviewer" \
  --priority high
```

### 4. Process the queue

```bash
npm start queue:process
```

### 5. Export results

```bash
npm start state:export results.json
```

## Configuration

### Config File

Create `~/.claudeclaw/config.json`:

```json
{
  "orchestrator": {
    "maxConcurrentAgents": 4,
    "taskTimeoutMs": 300000,
    "retryAttempts": 3
  },
  "agents": {
    "coordinator": {
      "model": "claude-opus-4-1"
    },
    "coder": {
      "model": "claude-opus-4-1"
    },
    "reviewer": {
      "model": "claude-opus-4-1"
    },
    "researcher": {
      "model": "claude-opus-4-1"
    }
  },
  "mcp": {
    "researcher": {
      "port": 3001,
      "enabled": true
    },
    "skills": {
      "port": 3002,
      "enabled": true
    }
  },
  "logging": {
    "level": "info",
    "format": "json"
  }
}
```

## Using Plugins

### Load a plugin programmatically

```typescript
import { ClaudeClawOrchestrator } from './orchestrator'
import { PluginManager } from './plugin-system'
import { createExamplePlugin } from './plugins/example-plugin'

const orchestrator = new ClaudeClawOrchestrator()
const pluginManager = new PluginManager()

// Load a plugin
await pluginManager.loadPlugin(createExamplePlugin())

// List loaded plugins
const plugins = pluginManager.listPlugins()
console.log('Loaded plugins:', plugins)
```

### Creating custom plugins

```typescript
import { ClaudeClawPlugin, PluginContext } from '@fillslava/claudeclaw'

export class MyPlugin implements ClaudeClawPlugin {
  name = 'my-plugin'
  version = '1.0.0'

  async initialize(context: PluginContext): Promise<void> {
    // Register tools
    context.registerTool('my-tool', async (args) => {
      return { result: 'processed' }
    })

    // Register hooks
    context.registerHook('task:start', async (taskContext) => {
      console.log('Task started:', taskContext.taskId)
    })

    // Register skills
    context.registerSkill('my-skill', {
      name: 'my-skill',
      description: 'My custom skill',
      handler: async (args) => {
        return JSON.stringify({ success: true })
      },
    })
  }
}
```

## Using Middleware

```typescript
import { MiddlewareChain, LoggingMiddleware, TimingMiddleware } from '@fillslava/claudeclaw'

const chain = new MiddlewareChain()

// Add built-in middleware
chain.register(new LoggingMiddleware())
chain.register(new TimingMiddleware())

// Use in orchestrator
// (Integration coming in future versions)
```

## Advanced Usage

### Task Dependencies

```bash
npm start task:add "Task 2" \
  --description "This task depends on Task 1" \
  --agents "coder" \
  --priority medium
```

### MCP Server Integration

Start MCP servers:

```bash
npm run mcp:researcher
npm run mcp:skills
```

In another terminal, use ClaudeClaw to interact with them via the MCP integration layer.

### Codex Executor

Enable Codex executor in config:

```json
{
  "codex": {
    "enabled": true,
    "apiKey": "your-codex-api-key",
    "workingDirectory": "/path/to/work"
  }
}
```

## Troubleshooting

### Build errors

```bash
npm run type-check  # Check for TypeScript errors
npm run lint        # Run ESLint
```

### API key issues

Ensure `ANTHROPIC_API_KEY` is set:

```bash
export ANTHROPIC_API_KEY=sk-...
npm start queue:process
```

### MCP server connection issues

Check server status:

```bash
curl -s http://localhost:3001/status
curl -s http://localhost:3002/status
```

## Development

```bash
# Watch mode
npm run dev

# Run tests
npm test

# Coverage report
npm test -- --coverage

# Format code
npm run format

# Lint code
npm run lint
```

## Next Steps

1. **Integrate with your CI/CD**: Use ClaudeClaw to automate code review, testing, and deployment
2. **Build custom plugins**: Extend ClaudeClaw with domain-specific tools and skills
3. **Connect to your data**: Integrate the Researcher MCP with your databases and data sources
4. **Deploy agents**: Run ClaudeClaw in production with proper monitoring and logging

## Resources

- [Architecture Overview](./README.md)
- [API Documentation](./docs/API.md) (coming soon)
- [Plugin Development Guide](./docs/PLUGINS.md) (coming soon)
- [Deployment Guide](./docs/DEPLOYMENT.md) (coming soon)

## Support

- Open an issue on GitHub
- Check existing issues for solutions
- Review the test suite for examples

## License

MIT
