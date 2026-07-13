import pino from 'pino'

const logger = pino()

export interface ClaudeClawPlugin {
  name: string
  version: string
  initialize(context: PluginContext): Promise<void>
  destroy?(): Promise<void>
}

export interface PluginContext {
  registerTool(name: string, handler: ToolHandler): void
  registerHook(event: string, handler: HookHandler): void
  registerSkill(name: string, skill: SkillDefinition): void
  getConfig(): Record<string, any>
  logger: typeof logger
}

export type ToolHandler = (args: Record<string, unknown>) => Promise<any>
export type HookHandler = (context: any) => Promise<void> | void

export interface SkillDefinition {
  name: string
  description: string
  handler: (args: Record<string, unknown>) => Promise<string>
  schema?: Record<string, unknown>
}

export class PluginManager {
  private plugins: Map<string, ClaudeClawPlugin> = new Map()
  private tools: Map<string, ToolHandler> = new Map()
  private hooks: Map<string, HookHandler[]> = new Map()
  private skills: Map<string, SkillDefinition> = new Map()

  async loadPlugin(plugin: ClaudeClawPlugin): Promise<void> {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin already loaded: ${plugin.name}`)
    }

    const context: PluginContext = {
      registerTool: (name: string, handler: ToolHandler) => this.registerTool(name, handler),
      registerHook: (event: string, handler: HookHandler) => this.registerHook(event, handler),
      registerSkill: (name: string, skill: SkillDefinition) => this.registerSkill(name, skill),
      getConfig: () => ({}),
      logger,
    }

    try {
      await plugin.initialize(context)
      this.plugins.set(plugin.name, plugin)
      logger.info({ plugin: plugin.name, version: plugin.version }, 'Plugin loaded')
    } catch (error) {
      logger.error(
        { plugin: plugin.name, error: error instanceof Error ? error.message : String(error) },
        'Failed to load plugin'
      )
      throw error
    }
  }

  async unloadPlugin(name: string): Promise<void> {
    const plugin = this.plugins.get(name)
    if (!plugin) {
      throw new Error(`Plugin not found: ${name}`)
    }

    if (plugin.destroy) {
      await plugin.destroy()
    }

    this.plugins.delete(name)
    logger.info({ plugin: name }, 'Plugin unloaded')
  }

  private registerTool(name: string, handler: ToolHandler): void {
    this.tools.set(name, handler)
    logger.debug({ tool: name }, 'Tool registered')
  }

  private registerHook(event: string, handler: HookHandler): void {
    if (!this.hooks.has(event)) {
      this.hooks.set(event, [])
    }
    this.hooks.get(event)!.push(handler)
    logger.debug({ event, hook: handler.name }, 'Hook registered')
  }

  private registerSkill(name: string, skill: SkillDefinition): void {
    this.skills.set(name, skill)
    logger.debug({ skill: name }, 'Skill registered')
  }

  async invokeHook(event: string, context: any): Promise<void> {
    const handlers = this.hooks.get(event) || []
    for (const handler of handlers) {
      try {
        await handler(context)
      } catch (error) {
        logger.error(
          { event, error: error instanceof Error ? error.message : String(error) },
          'Hook execution failed'
        )
      }
    }
  }

  async invokeTool(name: string, args: Record<string, unknown>): Promise<any> {
    const tool = this.tools.get(name)
    if (!tool) {
      throw new Error(`Tool not found: ${name}`)
    }

    try {
      const result = await tool(args)
      return result
    } catch (error) {
      logger.error(
        { tool: name, error: error instanceof Error ? error.message : String(error) },
        'Tool execution failed'
      )
      throw error
    }
  }

  listTools(): string[] {
    return Array.from(this.tools.keys())
  }

  listSkills(): SkillDefinition[] {
    return Array.from(this.skills.values())
  }

  listPlugins(): Array<{ name: string; version: string }> {
    return Array.from(this.plugins.values()).map((p) => ({
      name: p.name,
      version: p.version,
    }))
  }
}
