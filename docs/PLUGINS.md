# Plugin Development Guide

Build custom plugins to extend ClaudeClaw's capabilities.

## Table of Contents

1. [Plugin Basics](#plugin-basics)
2. [Plugin Lifecycle](#plugin-lifecycle)
3. [Registering Tools](#registering-tools)
4. [Registering Skills](#registering-skills)
5. [Registering Hooks](#registering-hooks)
6. [Complete Examples](#complete-examples)
7. [Testing Plugins](#testing-plugins)
8. [Publishing Plugins](#publishing-plugins)

---

## Plugin Basics

A ClaudeClaw plugin is a TypeScript class implementing the `ClaudeClawPlugin` interface.

### Plugin Interface

```typescript
interface ClaudeClawPlugin {
  name: string
  version: string
  initialize(context: PluginContext): Promise<void>
  destroy?(): Promise<void>
}
```

### Plugin Context

```typescript
interface PluginContext {
  registerTool(name: string, handler: ToolHandler): void
  registerHook(event: string, handler: HookHandler): void
  registerSkill(name: string, skill: SkillDefinition): void
  getConfig(): Record<string, any>
  logger: Logger
}
```

---

## Plugin Lifecycle

```
1. Plugin loaded
   ↓
2. Plugin.initialize(context) called
   ├─ registerTool()
   ├─ registerSkill()
   └─ registerHook()
   ↓
3. Plugin active (tools/skills/hooks available)
   ↓
4. Plugin.destroy() called (on unload)
   ↓
5. Plugin unloaded
```

---

## Registering Tools

Tools are functions available to agents.

### Basic Tool

```typescript
export class CalculatorPlugin implements ClaudeClawPlugin {
  name = 'calculator'
  version = '1.0.0'

  async initialize(context: PluginContext): Promise<void> {
    context.registerTool('add', async (args: any) => {
      return { result: args.a + args.b }
    })

    context.registerTool('multiply', async (args: any) => {
      return { result: args.a * args.b }
    })
  }
}
```

### Tool with Error Handling

```typescript
context.registerTool('divide', async (args: any) => {
  if (args.b === 0) {
    throw new Error('Division by zero')
  }
  return { result: args.a / args.b }
})
```

### Tool with Logging

```typescript
context.registerTool('process-data', async (args: any) => {
  context.logger.info({ input: args }, 'Processing data')
  
  try {
    const result = performProcessing(args)
    context.logger.info({ result }, 'Processing completed')
    return result
  } catch (error) {
    context.logger.error({ error }, 'Processing failed')
    throw error
  }
})
```

---

## Registering Skills

Skills are reusable capabilities with descriptions and schemas.

### Basic Skill

```typescript
context.registerSkill('summarize-text', {
  name: 'summarize-text',
  description: 'Summarize a given text to key points',
  handler: async (args: any) => {
    const text = args.text as string
    const summary = text.split('. ').slice(0, 3).join('. ')
    return JSON.stringify({
      summary,
      wordCount: text.split(' ').length,
    })
  },
})
```

### Skill with Schema

```typescript
context.registerSkill('translate-text', {
  name: 'translate-text',
  description: 'Translate text to target language',
  handler: async (args: any) => {
    const { text, targetLanguage } = args
    // Translation logic
    return JSON.stringify({ translated: text })
  },
  schema: {
    type: 'object',
    properties: {
      text: { type: 'string', description: 'Text to translate' },
      targetLanguage: { type: 'string', description: 'Target language code' },
    },
    required: ['text', 'targetLanguage'],
  },
})
```

### Multiple Skills

```typescript
const skills = [
  { name: 'extract-entities', description: '...', handler: async (args) => {...} },
  { name: 'sentiment-analysis', description: '...', handler: async (args) => {...} },
  { name: 'keyword-extraction', description: '...', handler: async (args) => {...} },
]

for (const skill of skills) {
  context.registerSkill(skill.name, skill)
}
```

---

## Registering Hooks

Hooks allow plugins to react to events during task execution.

### Available Hooks

```typescript
// Before task starts
context.registerHook('task:start', async (taskContext) => {
  console.log('Task starting:', taskContext.taskId)
})

// After task completes
context.registerHook('task:complete', async (taskContext) => {
  console.log('Task completed:', taskContext.taskId)
})

// On task error
context.registerHook('task:error', async (errorContext) => {
  console.log('Task error:', errorContext.error)
})

// Before agent execution
context.registerHook('agent:before', async (agentContext) => {
  console.log('Agent starting:', agentContext.agentId)
})

// After agent execution
context.registerHook('agent:after', async (agentContext) => {
  console.log('Agent completed:', agentContext.agentId)
})
```

### Hook with Async Operations

```typescript
context.registerHook('task:start', async (taskContext) => {
  // Async operations
  await saveTaskToDatabase(taskContext)
  await sendNotification(`Task ${taskContext.taskId} started`)
})
```

### Multiple Hooks for Same Event

```typescript
// Multiple handlers can register for same event
context.registerHook('task:complete', async (taskContext) => {
  await notifySlack(taskContext)
})

context.registerHook('task:complete', async (taskContext) => {
  await logToMetrics(taskContext)
})

context.registerHook('task:complete', async (taskContext) => {
  await archiveResults(taskContext)
})
```

---

## Complete Examples

### Example 1: Data Validation Plugin

```typescript
import { ClaudeClawPlugin, PluginContext } from '@fillslava/claudeclaw'

export class DataValidationPlugin implements ClaudeClawPlugin {
  name = 'data-validation'
  version = '1.0.0'

  async initialize(context: PluginContext): Promise<void> {
    // Register tools
    context.registerTool('validate-email', async (args: any) => {
      const email = args.email as string
      const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      return { valid: isValid }
    })

    context.registerTool('validate-phone', async (args: any) => {
      const phone = args.phone as string
      const isValid = /^\d{10}$/.test(phone.replace(/\D/g, ''))
      return { valid: isValid }
    })

    // Register skill
    context.registerSkill('validate-data', {
      name: 'validate-data',
      description: 'Validate various data formats',
      handler: async (args: any) => {
        const validations = {
          email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(args.email || ''),
          phone: /^\d{10}$/.test((args.phone || '').replace(/\D/g, '')),
          zipcode: /^\d{5}$/.test(args.zipcode || ''),
        }
        return JSON.stringify(validations)
      },
    })

    // Register hooks
    context.registerHook('task:start', async (taskContext) => {
      context.logger.info({ task: taskContext.taskId }, 'Validation plugin activated')
    })
  }
}
```

### Example 2: Caching Plugin

```typescript
export class CachingPlugin implements ClaudeClawPlugin {
  name = 'caching'
  version = '1.0.0'
  private cache = new Map<string, any>()

  async initialize(context: PluginContext): Promise<void> {
    context.registerTool('cache-set', async (args: any) => {
      this.cache.set(args.key, args.value)
      context.logger.info({ key: args.key }, 'Cached value')
      return { success: true }
    })

    context.registerTool('cache-get', async (args: any) => {
      const value = this.cache.get(args.key)
      return { value, found: value !== undefined }
    })

    context.registerTool('cache-clear', async (args: any) => {
      this.cache.clear()
      context.logger.info('Cache cleared')
      return { success: true }
    })

    context.registerSkill('cache-stats', {
      name: 'cache-stats',
      description: 'Get cache statistics',
      handler: async () => {
        return JSON.stringify({
          size: this.cache.size,
          keys: Array.from(this.cache.keys()),
        })
      },
    })
  }

  async destroy(): Promise<void> {
    this.cache.clear()
  }
}
```

### Example 3: Monitoring Plugin

```typescript
export class MonitoringPlugin implements ClaudeClawPlugin {
  name = 'monitoring'
  version = '1.0.0'
  private metrics = {
    tasksStarted: 0,
    tasksCompleted: 0,
    tasksFailed: 0,
    totalTokens: 0,
  }

  async initialize(context: PluginContext): Promise<void> {
    context.registerHook('task:start', async () => {
      this.metrics.tasksStarted++
    })

    context.registerHook('task:complete', async (taskContext) => {
      this.metrics.tasksCompleted++
      if (taskContext.results) {
        this.metrics.totalTokens += taskContext.results.reduce(
          (sum: number, r: any) => sum + (r.tokensUsed?.input || 0) + (r.tokensUsed?.output || 0),
          0
        )
      }
    })

    context.registerHook('task:error', async () => {
      this.metrics.tasksFailed++
    })

    context.registerSkill('get-metrics', {
      name: 'get-metrics',
      description: 'Get execution metrics',
      handler: async () => {
        return JSON.stringify(this.metrics)
      },
    })
  }
}
```

---

## Testing Plugins

### Unit Test Example

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { DataValidationPlugin } from './data-validation-plugin'
import { PluginContext } from '@fillslava/claudeclaw'

describe('DataValidationPlugin', () => {
  let plugin: DataValidationPlugin
  let mockContext: Partial<PluginContext>

  beforeEach(() => {
    plugin = new DataValidationPlugin()
    mockContext = {
      registerTool: (name: string, handler: any) => {
        // Store handler for testing
      },
      logger: console as any,
    }
  })

  it('should validate email addresses', async () => {
    let validateEmailFn: any

    const testContext: Partial<PluginContext> = {
      registerTool: (name: string, handler: any) => {
        if (name === 'validate-email') {
          validateEmailFn = handler
        }
      },
      logger: console as any,
    }

    await plugin.initialize(testContext as PluginContext)

    const result = await validateEmailFn({ email: 'test@example.com' })
    expect(result.valid).toBe(true)

    const invalidResult = await validateEmailFn({ email: 'invalid' })
    expect(invalidResult.valid).toBe(false)
  })
})
```

---

## Publishing Plugins

### NPM Package Structure

```
@fillslava/claudeclaw-plugin-name/
├── dist/
│   └── index.js
├── src/
│   └── index.ts
├── package.json
├── README.md
└── LICENSE
```

### package.json

```json
{
  "name": "@fillslava/claudeclaw-plugin-example",
  "version": "1.0.0",
  "description": "Example plugin for ClaudeClaw",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "vitest",
    "publish": "npm publish"
  },
  "peerDependencies": {
    "@fillslava/claudeclaw": "^0.1.0"
  },
  "keywords": [
    "claudeclaw",
    "plugin",
    "agent",
    "orchestration"
  ],
  "author": "Your Name",
  "license": "MIT"
}
```

### Publishing to NPM

```bash
# Login
npm login

# Build
npm run build

# Test
npm test

# Publish
npm publish

# Or publish as scoped public
npm publish --access public
```

---

## Best Practices

### 1. Error Handling

```typescript
context.registerTool('risky-operation', async (args: any) => {
  try {
    return await performRiskyOperation(args)
  } catch (error) {
    context.logger.error({ error }, 'Operation failed')
    return { error: error instanceof Error ? error.message : 'Unknown error' }
  }
})
```

### 2. Logging

```typescript
context.logger.info({ tool: 'my-tool', args }, 'Tool invoked')
context.logger.error({ error }, 'Tool failed')
context.logger.debug({ intermediate }, 'Debug information')
```

### 3. Validation

```typescript
context.registerTool('safe-operation', async (args: any) => {
  // Validate inputs
  if (!args.required) {
    throw new Error('Required parameter missing')
  }

  if (typeof args.number !== 'number') {
    throw new Error('Parameter must be a number')
  }

  // Perform operation
  return { result: args.number * 2 }
})
```

### 4. Resource Cleanup

```typescript
private connection: any = null

async initialize(context: PluginContext): Promise<void> {
  this.connection = await openConnection()
}

async destroy(): Promise<void> {
  if (this.connection) {
    await this.connection.close()
  }
}
```

### 5. Documentation

```typescript
context.registerSkill('documented-skill', {
  name: 'documented-skill',
  description: 'Brief description of what this skill does',
  handler: async (args: any) => {
    // Implementation
  },
  schema: {
    type: 'object',
    description: 'Schema describing input parameters',
    properties: {
      param1: {
        type: 'string',
        description: 'What param1 does'
      },
    },
    required: ['param1'],
  },
})
```

---

## Plugin Registry

List of community plugins:

- `@fillslava/claudeclaw-plugin-data-validation` - Data validation tools
- `@fillslava/claudeclaw-plugin-caching` - Caching layer
- `@fillslava/claudeclaw-plugin-monitoring` - Metrics and monitoring
- *(Add your plugin here!)*

---

## Resources

- [Plugin API Reference](./API.md#plugins)
- [Architecture Documentation](./ARCHITECTURE.md#extension-points)
- [Example Plugins Repository](https://github.com/fillslava/claudeclaw-plugins)
- [Testing Guide](./TESTING.md)
