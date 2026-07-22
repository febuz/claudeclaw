import { z } from 'zod'
import * as fs from 'fs'
import * as path from 'path'
import pino from 'pino'

const logger = pino()

const ConfigSchema = z.object({
  orchestrator: z.object({
    maxConcurrentAgents: z.number().int().min(1).max(32).default(4),
    taskTimeoutMs: z.number().int().min(1000).max(86_400_000).default(300000),
    retryAttempts: z.number().int().min(0).max(10).default(3),
  }),
  agents: z.object({
    coordinator: z.object({
      model: z.string().default('claude-opus-4-1'),
      systemPrompt: z.string().optional(),
    }),
    coder: z.object({
      model: z.string().default('claude-opus-4-1'),
      systemPrompt: z.string().optional(),
    }),
    reviewer: z.object({
      model: z.string().default('claude-opus-4-1'),
      systemPrompt: z.string().optional(),
    }),
    researcher: z.object({
      model: z.string().default('claude-opus-4-1'),
      systemPrompt: z.string().optional(),
    }),
  }),
  mcp: z.object({
    researcher: z.object({
      port: z.number().int().min(1024).max(65535).default(3001),
      enabled: z.boolean().default(true),
    }),
    skills: z.object({
      port: z.number().int().min(1024).max(65535).default(3002),
      enabled: z.boolean().default(true),
    }),
  }),
  logging: z.object({
    level: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    format: z.enum(['json', 'pretty']).default('json'),
  }),
  codex: z.object({
    enabled: z.boolean().default(false),
    apiKey: z.string().optional(),
    workingDirectory: z.string().default(process.cwd()),
  }),
})

export type Config = z.infer<typeof ConfigSchema>

export class ConfigManager {
  private config: Config
  private configPath: string

  constructor(configPath?: string) {
    this.configPath = configPath || this.getDefaultConfigPath()
    this.config = this.loadConfig()
  }

  private getDefaultConfigPath(): string {
    const homeDir = process.env.HOME || process.env.USERPROFILE || '.'
    return path.join(homeDir, '.claudeclaw', 'config.json')
  }

  private loadConfig(): Config {
    try {
      if (fs.existsSync(this.configPath)) {
        const rawConfig = JSON.parse(fs.readFileSync(this.configPath, 'utf-8'))
        const validatedConfig = ConfigSchema.parse(rawConfig)
        logger.info({ configPath: this.configPath }, 'Config loaded')
        return validatedConfig
      }
    } catch (error) {
      logger.warn(
        { error: error instanceof Error ? error.message : String(error) },
        'Failed to load config, using defaults'
      )
    }

    return ConfigSchema.parse({})
  }

  saveConfig(): void {
    const dir = path.dirname(this.configPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true, mode: 0o700 })
    }
    fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2), { mode: 0o600 })
    fs.chmodSync(this.configPath, 0o600)
    logger.info({ configPath: this.configPath }, 'Config saved')
  }

  get(): Config {
    return this.config
  }

  set(partial: Partial<Config>): void {
    this.config = ConfigSchema.parse({ ...this.config, ...partial })
  }

  getAgent(role: string): any {
    return this.config.agents[role as keyof typeof this.config.agents]
  }

  getMCPConfig(): typeof this.config.mcp {
    return this.config.mcp
  }

  static createDefaultConfig(): Config {
    return ConfigSchema.parse({})
  }

  static export(config: Config): string {
    const safeConfig = {
      ...config,
      codex: { ...config.codex, apiKey: config.codex.apiKey ? '[REDACTED]' : undefined },
    }
    return JSON.stringify(safeConfig, null, 2)
  }
}
