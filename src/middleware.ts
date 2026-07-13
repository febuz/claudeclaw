import pino from 'pino'
import { Agent, Task, AgentResult } from './types.js'

const logger = pino()

export interface Middleware {
  name: string
  onBeforeTaskExecution?(task: Task): Task | Promise<Task>
  onAfterTaskExecution?(task: Task, results: AgentResult[]): void | Promise<void>
  onBeforeAgentExecution?(agent: Agent, task: Task): void | Promise<void>
  onAfterAgentExecution?(agent: Agent, task: Task, result: AgentResult): AgentResult | Promise<AgentResult>
  onError?(error: Error, context: any): void | Promise<void>
}

export class MiddlewareChain {
  private middlewares: Middleware[] = []

  register(middleware: Middleware): void {
    this.middlewares.push(middleware)
    logger.info({ middleware: middleware.name }, 'Middleware registered')
  }

  async executeBeforeTaskExecution(task: Task): Promise<Task> {
    let current = task
    for (const middleware of this.middlewares) {
      if (middleware.onBeforeTaskExecution) {
        current = await middleware.onBeforeTaskExecution(current)
      }
    }
    return current
  }

  async executeAfterTaskExecution(task: Task, results: AgentResult[]): Promise<void> {
    for (const middleware of this.middlewares) {
      if (middleware.onAfterTaskExecution) {
        await middleware.onAfterTaskExecution(task, results)
      }
    }
  }

  async executeBeforeAgentExecution(agent: Agent, task: Task): Promise<void> {
    for (const middleware of this.middlewares) {
      if (middleware.onBeforeAgentExecution) {
        await middleware.onBeforeAgentExecution(agent, task)
      }
    }
  }

  async executeAfterAgentExecution(agent: Agent, task: Task, result: AgentResult): Promise<AgentResult> {
    let current = result
    for (const middleware of this.middlewares) {
      if (middleware.onAfterAgentExecution) {
        current = await middleware.onAfterAgentExecution(agent, task, current)
      }
    }
    return current
  }

  async executeErrorHandler(error: Error, context: any): Promise<void> {
    for (const middleware of this.middlewares) {
      if (middleware.onError) {
        try {
          await middleware.onError(error, context)
        } catch (err) {
          logger.error(
            { middleware: middleware.name, error: err instanceof Error ? err.message : String(err) },
            'Middleware error handler failed'
          )
        }
      }
    }
  }

  unregister(name: string): void {
    this.middlewares = this.middlewares.filter((m) => m.name !== name)
    logger.info({ middleware: name }, 'Middleware unregistered')
  }

  list(): string[] {
    return this.middlewares.map((m) => m.name)
  }
}

// Built-in middleware examples

export class LoggingMiddleware implements Middleware {
  name = 'logging'

  async onBeforeTaskExecution(task: Task): Promise<Task> {
    logger.info({ taskId: task.id, title: task.title }, 'Task execution starting')
    return task
  }

  async onAfterTaskExecution(task: Task, results: AgentResult[]): Promise<void> {
    logger.info(
      { taskId: task.id, resultCount: results.length },
      'Task execution completed'
    )
  }

  async onError(error: Error, context: any): Promise<void> {
    logger.error(
      { error: error.message, context },
      'Error occurred during execution'
    )
  }
}

export class TimingMiddleware implements Middleware {
  name = 'timing'
  private timers: Map<string, number> = new Map()

  async onBeforeTaskExecution(task: Task): Promise<Task> {
    this.timers.set(task.id, Date.now())
    return task
  }

  async onAfterTaskExecution(task: Task): Promise<void> {
    const startTime = this.timers.get(task.id) || 0
    const duration = Date.now() - startTime
    logger.info(
      { taskId: task.id, durationMs: duration },
      'Task execution timing'
    )
    this.timers.delete(task.id)
  }
}
