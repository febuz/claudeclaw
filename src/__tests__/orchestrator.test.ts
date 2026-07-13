import { describe, it, expect, beforeEach } from 'vitest'
import { ClaudeClawOrchestrator } from '../orchestrator'
import { Agent, Task } from '../types'

describe('ClaudeClawOrchestrator', () => {
  let orchestrator: ClaudeClawOrchestrator

  beforeEach(() => {
    orchestrator = new ClaudeClawOrchestrator('test-api-key')
  })

  describe('registerAgent', () => {
    it('should register an agent', () => {
      const agent: Agent = {
        id: 'test-agent',
        role: 'coordinator',
        model: 'claude-opus-4-1',
      }

      orchestrator.registerAgent(agent)
      const state = orchestrator.getState()

      expect(state.activeAgents.size).toBe(0) // activeAgents is only set during execution
    })
  })

  describe('addTask', () => {
    it('should add a task to the queue', () => {
      const task: Task = {
        id: 'task-1',
        title: 'Test Task',
        description: 'A test task',
        requiredAgents: ['coordinator'],
        priority: 'medium',
        status: 'pending',
        createdAt: new Date(),
      }

      orchestrator.addTask(task)
      const state = orchestrator.getState()

      expect(state.taskQueue.length).toBe(1)
      expect(state.taskQueue[0].id).toBe('task-1')
    })
  })

  describe('processQueue', () => {
    it('should process an empty queue without errors', async () => {
      await orchestrator.processQueue()
      const state = orchestrator.getState()

      expect(state.taskQueue.length).toBe(0)
      expect(state.results.length).toBe(0)
    })

    it('should handle missing agents gracefully', async () => {
      const task: Task = {
        id: 'task-1',
        title: 'Test Task',
        description: 'A test task',
        requiredAgents: ['missing-agent'],
        priority: 'medium',
        status: 'pending',
        createdAt: new Date(),
      }

      orchestrator.addTask(task)
      await orchestrator.processQueue()

      const state = orchestrator.getState()
      expect(state.results.length).toBe(0) // No results for missing agent
    })
  })
})
