export interface Agent {
  id: string
  role: 'coordinator' | 'coder' | 'reviewer' | 'researcher'
  model: string
  systemPrompt?: string
  tools?: string[]
}

export interface Task {
  id: string
  title: string
  description: string
  requiredAgents: string[]
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  createdAt: Date
  completedAt?: Date
  result?: unknown
  error?: string
}

export interface AgentResult {
  agentId: string
  taskId: string
  output: string
  toolCalls?: ToolCall[]
  tokensUsed: {
    input: number
    output: number
  }
  success: boolean
  error?: string
}

export interface ToolCall {
  name: string
  args: Record<string, unknown>
  result?: unknown
}

export interface OrchestrationState {
  taskQueue: Task[]
  activeAgents: Map<string, Agent>
  results: AgentResult[]
  startTime: Date
}

export interface MCPToolResult {
  content: {
    type: 'text'
    text: string
  }[]
}

export interface CodexPatchRequest {
  taskId: string
  fileContext: Map<string, string>
  taskSpec: string
  retryFeedback?: string
}

export interface CodexPatchResponse {
  taskId: string
  patch: string
  explanation: string
  tokensUsed: {
    input: number
    output: number
  }
}
