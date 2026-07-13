import { MCPToolResult } from '../types.js'
import pino from 'pino'

const logger = pino()

interface SkillInvocation {
  skillName: string
  args: Record<string, unknown>
}

interface SkillRegistry {
  [key: string]: {
    description: string
    handler: (args: Record<string, unknown>) => Promise<string>
  }
}

export class SkillsMCPServer {
  private port: number = 3002
  private registry: SkillRegistry = {}

  constructor(port?: number) {
    if (port) this.port = port
    this.initializeDefaultSkills()
    logger.info({ port: this.port }, 'Skills MCP Server initialized')
  }

  private initializeDefaultSkills(): void {
    this.registerSkill('task-graph', {
      description: 'Generate a task dependency graph',
      handler: async (args) => {
        return JSON.stringify({
          status: 'ok',
          message: 'Task graph generation pending',
          args,
        })
      },
    })

    this.registerSkill('code-review', {
      description: 'Review code for quality and security',
      handler: async (args) => {
        return JSON.stringify({
          status: 'ok',
          message: 'Code review pending',
          args,
        })
      },
    })

    this.registerSkill('test-runner', {
      description: 'Run tests and report results',
      handler: async (args) => {
        return JSON.stringify({
          status: 'ok',
          message: 'Test runner pending',
          args,
        })
      },
    })
  }

  registerSkill(
    name: string,
    skill: {
      description: string
      handler: (args: Record<string, unknown>) => Promise<string>
    }
  ): void {
    this.registry[name] = skill
    logger.info({ skill: name }, 'Skill registered')
  }

  async invokeSkill(invocation: SkillInvocation): Promise<MCPToolResult> {
    try {
      const skill = this.registry[invocation.skillName]
      if (!skill) {
        throw new Error(`Skill not found: ${invocation.skillName}`)
      }

      logger.info({ skill: invocation.skillName }, 'Invoking skill')
      const result = await skill.handler(invocation.args)

      return {
        content: [
          {
            type: 'text' as const,
            text: result,
          },
        ],
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      logger.error({ error: errorMsg }, 'Skill invocation failed')

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({ error: errorMsg }),
          },
        ],
      }
    }
  }

  listSkills(): MCPToolResult {
    const skills = Object.entries(this.registry).map(([name, skill]) => ({
      name,
      description: skill.description,
    }))

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(skills, null, 2),
        },
      ],
    }
  }
}

export async function startSkillsMCPServer(port?: number): Promise<void> {
  const server = new SkillsMCPServer(port)
  logger.info({ port: port || 3002 }, 'Skills MCP Server started')
}
