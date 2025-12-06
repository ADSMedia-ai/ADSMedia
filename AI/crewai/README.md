# ADSMedia CrewAI Tools

Send emails via ADSMedia API from CrewAI agents.

## Installation

```bash
pip install crewai crewai-tools requests
```

## Quick Start

```python
from crewai import Agent, Task, Crew
from adsmedia_tool import get_adsmedia_tools

# Set environment variable
# export ADSMEDIA_API_KEY=your-api-key

# Get tools
tools = get_adsmedia_tools()

# Create agent
email_agent = Agent(
    role="Email Specialist",
    goal="Send professional emails to users",
    backstory="Expert at crafting and sending effective emails",
    tools=tools,
    verbose=True,
)

# Create task
task = Task(
    description="Send a welcome email to user@example.com with a friendly greeting",
    agent=email_agent,
    expected_output="Confirmation that the email was sent successfully",
)

# Run
crew = Crew(agents=[email_agent], tasks=[task])
result = crew.kickoff()
```

## Available Tools

### Send Email

Send transactional emails.

```python
tool = ADSMediaSendEmailTool()
result = tool._run(
    to="user@example.com",
    subject="Hello!",
    html="<h1>Welcome!</h1>",
)
```

### Check Suppression

Verify email deliverability.

```python
tool = ADSMediaCheckSuppressionTool()
result = tool._run(email="user@example.com")
```

## Multi-Agent Example

```python
from crewai import Agent, Task, Crew

# Email verification agent
verifier = Agent(
    role="Email Verifier",
    goal="Verify email addresses are deliverable",
    tools=[ADSMediaCheckSuppressionTool()],
)

# Email sender agent
sender = Agent(
    role="Email Sender",
    goal="Send well-crafted emails",
    tools=[ADSMediaSendEmailTool()],
)

# Tasks
verify_task = Task(
    description="Check if john@example.com can receive emails",
    agent=verifier,
)

send_task = Task(
    description="Send a welcome email to john@example.com",
    agent=sender,
    context=[verify_task],  # Depends on verification
)

# Run
crew = Crew(agents=[verifier, sender], tasks=[verify_task, send_task])
result = crew.kickoff()
```

## Links

- [API Documentation](https://www.adsmedia.ai/api-docs)
- [CrewAI Docs](https://docs.crewai.com)
- [GitHub](https://github.com/ADSMedia-ai/ADSMedia)

## License

MIT © [ADSMedia](https://www.adsmedia.ai)

