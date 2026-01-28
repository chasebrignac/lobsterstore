#!/bin/bash
# LobsterLoop Ralph Execution Wrapper
# This script is executed via SSM on EC2 instances

set -e

EXECUTION_ID=$1
PRD_JSON=$2
API_KEY=$3
PROVIDER=$4
TOOL=$5

if [ -z "$EXECUTION_ID" ] || [ -z "$PRD_JSON" ] || [ -z "$API_KEY" ] || [ -z "$PROVIDER" ] || [ -z "$TOOL" ]; then
  echo "Usage: $0 <execution_id> <prd_json> <api_key> <provider> <tool>"
  exit 1
fi

WORK_DIR="/opt/lobsterloop/executions/${EXECUTION_ID}"
mkdir -p "$WORK_DIR"
cd "$WORK_DIR"

echo "Starting Ralph execution for: $EXECUTION_ID"
echo "Provider: $PROVIDER"
echo "Working directory: $WORK_DIR"

# Write prd.json
echo "$PRD_JSON" > prd.json
echo "PRD written to prd.json"

# Set API key based on provider
case "$PROVIDER" in
  "anthropic")
    export ANTHROPIC_API_KEY="$API_KEY"
    echo "Using Anthropic API"
    ;;
  "openai")
    export OPENAI_API_KEY="$API_KEY"
    echo "Using OpenAI API"
    ;;
  "xai")
    export XAI_API_KEY="$API_KEY"
    echo "Using xAI API"
    ;;
  "kimi")
    export KIMI_API_KEY="$API_KEY"
    echo "Using Kimi API"
    ;;
  *)
    echo "Unknown provider: $PROVIDER"
    exit 1
    ;;
esac

# Copy Ralph scripts
cp /opt/ralph/ralph.sh .
cp /opt/ralph/CLAUDE.md .
echo "Ralph scripts copied"

# Map friendly tool names to Ralph tool flag
case "$TOOL" in
  "claude-code")
    TOOL_FLAG="claude"
    ;;
  "codex")
    TOOL_FLAG="codex"
    ;;
  "opencode")
    TOOL_FLAG="opencode"
    ;;
  *)
    TOOL_FLAG="claude"
    ;;
esac

# Execute Ralph with selected tool
echo "Starting Ralph execution with tool: $TOOL_FLAG..."
./ralph.sh --tool "$TOOL_FLAG" 50 2>&1 | tee ralph-output.log

# Save exit code
EXIT_CODE=${PIPESTATUS[0]}
echo $EXIT_CODE > exit-code.txt
echo "Ralph execution completed with exit code: $EXIT_CODE"

# Copy final prd.json to output
cp prd.json final-prd.json

exit $EXIT_CODE
