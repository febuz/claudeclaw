import Anthropic from '@anthropic-ai/sdk'
import pino from 'pino'
import { Agent, Task, AgentResult, OrchestrationState } from './types.js'

const logger = pino()

export class ClaudeClawOrchestrator {
  private client: Anthropic
  private state: OrchestrationState
  private agents: Map<string, Agent> = new Map()

  constructor(apiKey?: string) {
    this.client = new Anthropic({ apiKey })
    this.state = {
      taskQueue: [],
      activeAgents: new Map(),
      results: [],
      startTime: new Date(),
    }
  }

  registerAgent(agent: Agent): void {
    this.agents.set(agent.id, agent)
    logger.info({ agentId: agent.id, role: agent.role }, 'Agent registered')
  }

  addTask(task: Task): void {
    this.state.taskQueue.push(task)
    logger.info({ taskId: task.id, title: task.title }, 'Task queued')
  }

  async executeTask(task: Task): Promise<AgentResult[]> {
    const results: AgentResult[] = []

    for (const agentId of task.requiredAgents) {
      const agent = this.agents.get(agentId)
      if (!agent) {
        logger.error({ agentId }, 'Agent not found')
        continue
      }

      task.status = 'in_progress'
      const result = await this.executeAgent(agent, task)
      results.push(result)
      this.state.results.push(result)

      if (!result.success) {
        task.status = 'failed'
        task.error = result.error || 'Unknown error'
        break
      }
    }

    task.status = task.status === 'in_progress' ? 'completed' : task.status
    task.completedAt = new Date()

    return results
  }

  private async executeAgent(agent: Agent, task: Task): Promise<AgentResult> {
    const systemPrompt = agent.systemPrompt || this.getDefaultSystemPrompt(agent.role)

    try {
      const response = await this.client.messages.create({
        model: agent.model,
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `Task: ${task.title}\n\nDescription: ${task.description}`,
          },
        ],
      })

      const output =
        response.content[0].type === 'text'
          ? response.content[0].text
          : 'Non-text response'

      return {
        agentId: agent.id,
        taskId: task.id,
        output,
        success: true,
        tokensUsed: {
          input: response.usage.input_tokens,
          output: response.usage.output_tokens,
        },
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      logger.error({ agentId: agent.id, taskId: task.id, error: errorMsg }, 'Agent execution failed')

      return {
        agentId: agent.id,
        taskId: task.id,
        output: '',
        success: false,
        error: errorMsg,
        tokensUsed: { input: 0, output: 0 },
      }
    }
  }

  private getDefaultSystemPrompt(role: string): string {
    const prompts: Record<string, string> = {
      coordinator:
        'You are a task orchestrator. Your role is to coordinate other agents and plan execution strategy.',
      coder: 'You are a code generation expert. Write clear, maintainable, and well-tested code.',
      reviewer: 'You are a code reviewer. Provide constructive feedback on code quality and architecture.',
      researcher: 'You are a research specialist. Find and synthesize information from various sources.',
    }

    return prompts[role] || 'You are a helpful AI assistant.'
  }

  async processQueue(): Promise<void> {
    while (this.state.taskQueue.length > 0) {
      const task = this.state.taskQueue.shift()!
      logger.info({ taskId: task.id }, 'Processing task')
      await this.executeTask(task)
    }

    logger.info(
      {
        totalTasks: this.state.results.length,
        duration: new Date().getTime() - this.state.startTime.getTime(),
      },
      'Queue processing completed'
    )
  }

  getState(): OrchestrationState {
    return this.state
  }
}
