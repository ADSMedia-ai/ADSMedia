# ADSMedia LlamaIndex Tools

Send emails via ADSMedia API from LlamaIndex agents.

## Installation

```bash
pip install llama-index llama-index-llms-openai requests
```

## Quick Start

```python
from llama_index.core.agent import ReActAgent
from llama_index.llms.openai import OpenAI
from adsmedia_tool import get_adsmedia_tools

# Set environment variables
# export ADSMEDIA_API_KEY=your-api-key
# export OPENAI_API_KEY=your-openai-key

# Get tools
tools = get_adsmedia_tools()

# Create agent
llm = OpenAI(model="gpt-4")
agent = ReActAgent.from_tools(tools, llm=llm, verbose=True)

# Run
response = agent.chat("Send a welcome email to user@example.com")
print(response)
```

## Available Tools

### send_email

Send transactional emails.

```python
result = send_email(
    to="user@example.com",
    subject="Hello!",
    html="<h1>Welcome!</h1>",
)
```

### check_suppression

Check email deliverability.

```python
result = check_suppression("user@example.com")
```

### ping

Test API connection.

```python
result = ping()
```

## Example Prompts

```python
agent.chat("Send a welcome email to john@example.com")
agent.chat("Check if jane@example.com can receive emails")
agent.chat("Test the email API connection")
```

## Links

- [API Documentation](https://www.adsmedia.ai/api-docs)
- [LlamaIndex Docs](https://docs.llamaindex.ai)
- [GitHub](https://github.com/ADSMedia-ai/ADSMedia)

## License

MIT © [ADSMedia](https://www.adsmedia.ai)

