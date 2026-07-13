# Contributing to ClaudeClaw

Thank you for your interest in contributing to ClaudeClaw! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Style](#code-style)
- [Testing](#testing)
- [Commit Messages](#commit-messages)
- [Pull Requests](#pull-requests)
- [Reporting Issues](#reporting-issues)

---

## Code of Conduct

- Be respectful and inclusive
- No harassment, discrimination, or abuse
- Focus on constructive feedback
- Respect diverse perspectives and experiences

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- Git
- ANTHROPIC_API_KEY for testing

### Setup Development Environment

```bash
# Clone repository
git clone https://github.com/fillslava/claudeclaw.git
cd claudeclaw

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env

# Verify setup
npm run build
npm test
```

---

## Development Workflow

### Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

Branch naming convention:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions

### Make Changes

1. Make your code changes
2. Run linting: `npm run lint`
3. Run type checking: `npm run type-check`
4. Run tests: `npm test`
5. Build: `npm run build`

### Commit Changes

```bash
git add .
git commit -m "Brief description of changes"
```

See [Commit Messages](#commit-messages) for guidelines.

### Push to Remote

```bash
git push origin feature/your-feature-name
```

### Create Pull Request

Push your branch and create a PR on GitHub with:
- Clear title describing the changes
- Description of what was changed and why
- Reference to any related issues (#123)
- Screenshots/examples if applicable

---

## Code Style

### TypeScript

- Use strict mode: `"strict": true` in tsconfig.json
- No `any` types without justification
- Use explicit return types for functions
- Prefer interfaces over type aliases for public APIs

```typescript
// Good
export interface Agent {
  id: string
  role: AgentRole
}

async function executeTask(task: Task): Promise<AgentResult[]> {
  // ...
}

// Avoid
const executeTask = async (task: any): any => {
  // ...
}
```

### Naming Conventions

- Classes: PascalCase (`ClaudeClawOrchestrator`)
- Functions/variables: camelCase (`executeTask`, `taskQueue`)
- Constants: UPPER_SNAKE_CASE (`MAX_RETRIES`, `DEFAULT_TIMEOUT`)
- Files: kebab-case (`orchestrator.ts`, `mcp-integration.ts`)

### Comments

- Use comments to explain WHY, not WHAT
- Keep comments up-to-date with code
- Avoid redundant comments

```typescript
// Good: Explains the why
// Retry with exponential backoff to avoid overwhelming the API
await sleep(Math.pow(2, retryCount) * 1000)

// Avoid: Explains the what (code is self-explanatory)
// Add the two numbers
const result = a + b
```

### Formatting

```bash
npm run format  # Auto-format with Prettier
```

---

## Testing

### Write Tests

```typescript
import { describe, it, expect } from 'vitest'
import { MyClass } from './my-class'

describe('MyClass', () => {
  it('should perform expected behavior', () => {
    const result = new MyClass().doSomething()
    expect(result).toBe(expectedValue)
  })
})
```

### Run Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- orchestrator.test.ts

# Watch mode
npm test -- --watch
```

### Test Naming Convention

- Test file: `<module>.test.ts`
- Test describes: `describe('ClassName', () => { ... })`
- Test assertions: `it('should [expected behavior]', () => { ... })`

### Coverage Goals

- Aim for 80%+ code coverage
- Critical paths: 100%
- Helper utilities: 70%+

---

## Commit Messages

Follow conventional commits format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style (formatting, semicolons, etc.)
- `refactor`: Code refactoring
- `test`: Test additions/updates
- `chore`: Build, dependencies, tooling

### Scope

- Optional scope of the changes
- Examples: `orchestrator`, `mcp-integration`, `cli`

### Subject

- Use imperative mood: "add" not "adds" or "added"
- Don't capitalize first letter
- No period at the end
- Limit to 50 characters

### Body

- Explain what and why, not how
- Wrap at 72 characters
- Separate from subject with blank line

### Examples

```
feat(orchestrator): add task priority queue

Implement priority-based task queue with 4 levels
(low, medium, high, critical). Tasks are processed
in priority order, with same-priority tasks using FIFO.

Closes #123
```

```
fix(mcp-integration): handle connection timeouts

Add exponential backoff retry logic for MCP server
connections. Prevents cascading failures when a
server is temporarily unavailable.
```

---

## Pull Requests

### Before Submitting

- [ ] Branch is up-to-date with `master`
- [ ] Lint passes: `npm run lint`
- [ ] Types check: `npm run type-check`
- [ ] Tests pass: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] Documentation updated if needed
- [ ] No debug code or console.log statements

### PR Description Template

```markdown
## Description
Brief summary of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation

## Related Issues
Closes #123

## Testing
- [ ] Added tests
- [ ] All tests pass
- [ ] Manual testing performed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review complete
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings generated
```

### Review Process

1. Code review by maintainers
2. Automated tests must pass
3. Merge conflicts resolved
4. Approved by at least one maintainer
5. Squash and merge to master

---

## Reporting Issues

### Bug Reports

Include:
- Clear title and description
- Steps to reproduce
- Expected vs actual behavior
- Environment details (Node version, OS, etc.)
- Error messages/stack traces
- Code snippet if applicable

```markdown
## Description
Brief description of the bug

## Steps to Reproduce
1. Do X
2. Do Y
3. Do Z

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- Node version: 20.x
- OS: Linux
- ClaudeClaw version: 0.1.0

## Error Message
```
<error stack trace>
```
```

### Feature Requests

Include:
- Clear title and description
- Use case and motivation
- Proposed implementation (if applicable)
- Examples or mockups

```markdown
## Description
Feature description

## Motivation
Why this feature is needed

## Proposed Solution
How it could be implemented

## Example Usage
```typescript
// Example code showing the feature
```
```

---

## Development Tips

### Debug Mode

```bash
DEBUG=claudeclaw:* npm start queue:process
```

### Watch Mode

```bash
npm run dev
```

Automatically rebuilds on file changes.

### Testing in Docker

```bash
docker build -t claudeclaw-dev .
docker run -it claudeclaw-dev npm test
```

### Performance Profiling

```bash
node --prof dist/cli.js queue:process
node --prof-process isolate-*.log > profile.txt
```

---

## Project Structure

```
src/
  ├── cli.ts                 # CLI interface
  ├── orchestrator.ts        # Core orchestration
  ├── types.ts              # Type definitions
  ├── config.ts             # Configuration management
  ├── plugin-system.ts      # Plugin architecture
  ├── middleware.ts         # Middleware chain
  ├── codex/
  │   └── executor.ts       # Codex integration
  ├── mcp-servers/
  │   ├── researcher-mcp.ts
  │   └── skills-mcp.ts
  ├── integrations/
  │   └── mcp-integration.ts
  ├── plugins/
  │   └── example-plugin.ts
  └── __tests__/
      └── orchestrator.test.ts

docs/
  ├── ARCHITECTURE.md       # System design
  ├── API.md               # API reference
  ├── PLUGINS.md           # Plugin development
  └── DEPLOYMENT.md        # Deployment guide
```

---

## Additional Resources

- [Architecture Documentation](./docs/ARCHITECTURE.md)
- [API Reference](./docs/API.md)
- [Plugin Development](./docs/PLUGINS.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [GitHub Issues](https://github.com/fillslava/claudeclaw/issues)

---

## Questions?

- Open an issue on GitHub
- Check existing issues and discussions
- Review documentation first

---

## License

By contributing to ClaudeClaw, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing! 🙏
