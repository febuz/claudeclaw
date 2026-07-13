import { ClaudeClawPlugin, PluginContext } from '../plugin-system'

export class ExamplePlugin implements ClaudeClawPlugin {
  name = 'example-plugin'
  version = '1.0.0'

  async initialize(context: PluginContext): Promise<void> {
    context.logger.info('Initializing example plugin')

    // Register a simple tool
    context.registerTool('echo', async (args) => {
      return { message: args.message || 'Hello from example plugin!' }
    })

    // Register a hook
    context.registerHook('task:start', async (taskContext) => {
      context.logger.info({ taskId: taskContext.taskId }, 'Task started')
    })

    // Register a skill
    context.registerSkill('summarize-text', {
      name: 'summarize-text',
      description: 'Summarize a given text to key points',
      handler: async (args) => {
        const text = args.text as string
        return JSON.stringify({
          summary: `Summarized: ${text.substring(0, 50)}...`,
          wordCount: text.split(' ').length,
        })
      },
    })
  }
}

export function createExamplePlugin(): ClaudeClawPlugin {
  return new ExamplePlugin()
}
