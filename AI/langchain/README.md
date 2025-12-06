# ADSMedia LangChain Tools

Send emails via ADSMedia API from LangChain agents.

## Installation

```bash
pip install langchain langchain-openai requests
```

## Quick Start

```python
from langchain.agents import initialize_agent, AgentType
from langchain_openai import ChatOpenAI
from adsmedia_tool import get_adsmedia_tools

# Set environment variables
# export ADSMEDIA_API_KEY=your-api-key
# export OPENAI_API_KEY=your-openai-key

# Get ADSMedia tools
tools = get_adsmedia_tools()

# Initialize LLM and agent
llm = ChatOpenAI(temperature=0)
agent = initialize_agent(
    tools,
    llm,
    agent=AgentType.STRUCTURED_CHAT_ZERO_SHOT_REACT_DESCRIPTION,
    verbose=True,
)

# Run
result = agent.run("Send a welcome email to user@example.com with subject 'Hello!'")
print(result)
```

## Available Tools

### `adsmedia_send_email`

Send transactional emails.

**Parameters:**
- `to` (required): Recipient email address
- `subject` (required): Email subject line
- `html` (required): HTML content
- `to_name` (optional): Recipient name
- `from_name` (optional): Sender display name

### `adsmedia_check_suppression`

Check if an email is suppressed before sending.

**Parameters:**
- `email` (required): Email address to check

## Usage with Different Agents

### ReAct Agent

```python
from langchain.agents import AgentType, initialize_agent

agent = initialize_agent(
    tools,
    llm,
    agent=AgentType.STRUCTURED_CHAT_ZERO_SHOT_REACT_DESCRIPTION,
)
```

### OpenAI Functions Agent

```python
from langchain.agents import AgentType, initialize_agent

agent = initialize_agent(
    tools,
    llm,
    agent=AgentType.OPENAI_FUNCTIONS,
)
```

### Custom Chain

```python
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate

# Direct tool usage
send_tool = ADSMediaSendEmailTool()
result = send_tool.run({
    "to": "user@example.com",
    "subject": "Hello!",
    "html": "<h1>Welcome!</h1>",
})
```

## Example Prompts

```python
# Send notification
agent.run("Send an email to john@example.com notifying him that his order #12345 has shipped")

# Check before sending
agent.run("First check if jane@example.com is suppressed, then send her a welcome email")

# Personalized email
agent.run("Send a birthday email to mike@example.com with his name in the greeting")
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `ADSMEDIA_API_KEY` | Your ADSMedia API key |
| `OPENAI_API_KEY` | OpenAI API key (for LLM) |

## Links

- [API Documentation](https://www.adsmedia.ai/api-docs)
- [LangChain Docs](https://python.langchain.com)
- [GitHub](https://github.com/ADSMedia-ai/ADSMedia)

## License

MIT © [ADSMedia](https://www.adsmedia.ai)

