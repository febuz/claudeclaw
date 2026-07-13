import pino from 'pino'
import { MCPToolResult } from '../types.js'

const logger = pino()

export interface MCPServerConfig {
  name: string
  port: number
  enabled: boolean
  baseUrl?: string
}

export class MCPIntegration {
  private servers: Map<string, MCPServerConfig> = new Map()
  private cache: Map<string, any> = new Map()

  registerServer(config: MCPServerConfig): void {
    this.servers.set(config.name, config)
    logger.info({ server: config.name, port: config.port }, 'MCP server registered')
  }

  async callTool(
    serverName: string,
    toolName: string,
    args: Record<string, unknown>
  ): Promise<MCPToolResult> {
    const server = this.servers.get(serverName)
    if (!server) {
      throw new Error(`MCP server not found: ${serverName}`)
    }

    if (!server.enabled) {
      throw new Error(`MCP server disabled: ${serverName}`)
    }

    try {
      const cacheKey = `${serverName}:${toolName}:${JSON.stringify(args)}`
      if (this.cache.has(cacheKey)) {
        logger.debug({ cacheKey }, 'Cache hit')
        return this.cache.get(cacheKey)
      }

      // TODO: Implement actual HTTP/JSON-RPC call to MCP server
      const result: MCPToolResult = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              status: 'ok',
              message: `Tool ${toolName} called on ${serverName}`,
              args,
              note: 'MCP HTTP integration pending',
            }),
          },
        ],
      }

      this.cache.set(cacheKey, result)
      return result
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      logger.error(
        { server: serverName, tool: toolName, error: errorMsg },
        'MCP call failed'
      )

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ error: errorMsg }),
          },
        ],
      }
    }
  }

  clearCache(): void {
    this.cache.clear()
    logger.info('MCP cache cleared')
  }

  getServerStatus(): Record<string, { enabled: boolean; port: number }> {
    const status: Record<string, { enabled: boolean; port: number }> = {}
    for (const [name, config] of this.servers) {
      status[name] = { enabled: config.enabled, port: config.port }
    }
    return status
  }
}
