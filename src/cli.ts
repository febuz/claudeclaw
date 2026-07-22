#!/usr/bin/env node

import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import pino from 'pino'
import { ClaudeClawOrchestrator } from './orchestrator.js'
import { Agent, Task } from './types.js'
import * as fs from 'fs'
import * as path from 'path'
import { randomUUID } from 'node:crypto'

const logger = pino()

function safeExportPath(filename: string): string {
  const resolved = path.resolve(filename)
  const root = path.resolve(process.cwd()) + path.sep
  if (!resolved.startsWith(root)) {
    throw new Error('state export path must remain inside the current working directory')
  }
  return resolved
}

interface CLIContext {
  orchestrator: ClaudeClawOrchestrator
}

async function main(): Promise<void> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  const orchestrator = new ClaudeClawOrchestrator(apiKey)

  await yargs(hideBin(process.argv))
    .command(
      'agent:register <id> <role> <model>',
      'Register a new agent',
      (y: any) =>
        y
          .positional('id', { describe: 'Agent ID', type: 'string' })
          .positional('role', {
            describe: 'Agent role',
            choices: ['coordinator', 'coder', 'reviewer', 'researcher'],
            type: 'string',
          })
          .positional('model', { describe: 'Claude model to use', type: 'string' }),
      (argv: any) => {
        const agent: Agent = {
          id: argv.id as string,
          role: argv.role as 'coordinator' | 'coder' | 'reviewer' | 'researcher',
          model: argv.model as string,
        }
        orchestrator.registerAgent(agent)
        logger.info({ agent }, 'Agent registered')
      }
    )
    .command(
      'task:add <title>',
      'Add a task to the queue',
      (y: any) =>
        y
          .positional('title', { describe: 'Task title', type: 'string' })
          .option('description', { describe: 'Task description', type: 'string', default: '' })
          .option('agents', {
            describe: 'Comma-separated list of agent IDs',
            type: 'string',
            default: 'coordinator',
          })
          .option('priority', {
            describe: 'Task priority',
            choices: ['low', 'medium', 'high', 'critical'],
            default: 'medium',
            type: 'string',
          }),
      (argv: any) => {
        const task: Task = {
          id: `task-${randomUUID()}`,
          title: argv.title as string,
          description: argv.description as string,
          requiredAgents: (argv.agents as string).split(',').map((a) => a.trim()),
          priority: argv.priority as 'low' | 'medium' | 'high' | 'critical',
          status: 'pending',
          createdAt: new Date(),
        }
        orchestrator.addTask(task)
        logger.info({ task }, 'Task added to queue')
      }
    )
    .command(
      'queue:process',
      'Process all tasks in the queue',
      {},
      async (argv: any) => {
        try {
          await orchestrator.processQueue()
          const state = orchestrator.getState()
          logger.info('Queue processing completed')
          logger.info(`Total tasks: ${state.results.length}`)
          logger.info(`Duration: ${new Date().getTime() - state.startTime.getTime()}ms`)
        } catch (error) {
          logger.error(error, 'Queue processing failed')
          process.exit(1)
        }
      }
    )
    .command(
      'state:export <filename>',
      'Export orchestration state to JSON',
      (y: any) => y.positional('filename', { describe: 'Output filename', type: 'string' }),
      (argv: any) => {
        const state = orchestrator.getState()
        const output = {
          ...state,
          startTime: state.startTime.toISOString(),
          results: state.results.map((r) => ({
            ...r,
          })),
        }
        const outputPath = safeExportPath(argv.filename as string)
        fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), { mode: 0o600 })
        fs.chmodSync(outputPath, 0o600)
        logger.info({ file: outputPath }, 'State exported')
      }
    )
    .option('verbose', {
      alias: 'v',
      describe: 'Enable verbose logging',
      type: 'boolean',
      default: false,
    })
    .help()
    .alias('help', 'h')
    .parse()
}

main().catch((error) => {
  logger.error(error, 'Fatal error')
  process.exit(1)
})
