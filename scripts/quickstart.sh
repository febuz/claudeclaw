#!/bin/bash

# ClaudeClaw Quick Start Script
# Sets up and runs a basic orchestration example

set -e

echo "🚀 ClaudeClaw Quick Start"
echo "=========================="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+"
    exit 1
fi

NODE_VERSION=$(node -v)
echo "✅ Node.js $NODE_VERSION"

# Check API key
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "❌ ANTHROPIC_API_KEY environment variable not set"
    echo "   Run: export ANTHROPIC_API_KEY=sk-..."
    exit 1
fi

echo "✅ ANTHROPIC_API_KEY is set"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
if [ ! -d "node_modules" ]; then
    npm install --legacy-peer-deps > /dev/null 2>&1
fi
echo "✅ Dependencies installed"
echo ""

# Build
echo "🔨 Building project..."
npm run build > /dev/null 2>&1
echo "✅ Build successful"
echo ""

# Register agents
echo "👥 Registering agents..."
npm start agent:register coordinator coordinator claude-opus-4-1 > /dev/null 2>&1
npm start agent:register coder coder claude-opus-4-1 > /dev/null 2>&1
npm start agent:register reviewer reviewer claude-opus-4-1 > /dev/null 2>&1
echo "✅ 3 agents registered (coordinator, coder, reviewer)"
echo ""

# Create example task
echo "📋 Creating example task..."
TASK_TITLE="Implement a simple TypeScript utility"
npm start task:add "$TASK_TITLE" \
    --description "Create a reusable utility function with comprehensive tests" \
    --agents "coordinator,coder,reviewer" \
    --priority high > /dev/null 2>&1
echo "✅ Task queued: '$TASK_TITLE'"
echo ""

# Process queue
echo "⚙️  Processing task queue..."
echo ""
npm start queue:process
echo ""

# Export results
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RESULTS_FILE="results_${TIMESTAMP}.json"
echo "📊 Exporting results to $RESULTS_FILE..."
npm start state:export "$RESULTS_FILE" > /dev/null 2>&1
echo "✅ Results exported"
echo ""

# Summary
echo "🎉 Quick Start Complete!"
echo "=========================="
echo ""
echo "📁 Results: $RESULTS_FILE"
echo "📖 Documentation: GETTING_STARTED.md"
echo "🔗 GitHub: https://github.com/febuz/claudeclaw"
echo ""
echo "Next steps:"
echo "1. Review results: cat $RESULTS_FILE | jq ."
echo "2. Run more tasks: npm start task:add \"Your task\" --agents coder,reviewer"
echo "3. Read docs: cat GETTING_STARTED.md"
echo ""
