"""
ADSMedia Tool for LlamaIndex
Send emails using ADSMedia API from LlamaIndex agents

pip install llama-index requests
"""

import os
import requests
from typing import Optional
from llama_index.core.tools import FunctionTool

API_BASE_URL = "https://api.adsmedia.live/v1"


def get_api_key() -> str:
    """Get API key from environment."""
    key = os.getenv("ADSMEDIA_API_KEY", "")
    if not key:
        raise ValueError("ADSMEDIA_API_KEY environment variable not set")
    return key


def send_email(
    to: str,
    subject: str,
    html: str,
    to_name: Optional[str] = None,
    from_name: Optional[str] = None,
) -> str:
    """
    Send an email via ADSMedia API.
    
    Args:
        to: Recipient email address (required)
        subject: Email subject line (required)
        html: HTML content of the email (required)
        to_name: Recipient name (optional)
        from_name: Sender display name (optional)
    
    Returns:
        Success message with message ID or error message
    """
    api_key = get_api_key()
    
    payload = {
        "to": to,
        "subject": subject,
        "html": html,
    }
    if to_name:
        payload["to_name"] = to_name
    if from_name:
        payload["from_name"] = from_name
    
    try:
        response = requests.post(
            f"{API_BASE_URL}/send",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=30,
        )
        data = response.json()
        
        if data.get("success"):
            return f"Email sent successfully to {to}. Message ID: {data['data']['message_id']}"
        else:
            return f"Error sending email: {data.get('error', 'Unknown error')}"
    except Exception as e:
        return f"Error: {str(e)}"


def check_suppression(email: str) -> str:
    """
    Check if an email address is suppressed (bounced, unsubscribed, or blocked).
    
    Args:
        email: Email address to check (required)
    
    Returns:
        Status message indicating if email is suppressed or safe to send
    """
    api_key = get_api_key()
    
    try:
        response = requests.get(
            f"{API_BASE_URL}/suppressions/check",
            headers={"Authorization": f"Bearer {api_key}"},
            params={"email": email},
            timeout=30,
        )
        data = response.json()
        
        if data.get("success"):
            if data["data"].get("suppressed"):
                return f"Email {email} is SUPPRESSED. Reason: {data['data'].get('reason', 'Unknown')}"
            return f"Email {email} is NOT suppressed - safe to send."
        else:
            return f"Error: {data.get('error', 'Unknown error')}"
    except Exception as e:
        return f"Error: {str(e)}"


def ping() -> str:
    """
    Test ADSMedia API connection.
    
    Returns:
        Connection status message
    """
    api_key = get_api_key()
    
    try:
        response = requests.get(
            f"{API_BASE_URL}/ping",
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=30,
        )
        data = response.json()
        
        if data.get("success"):
            return f"Connected! User ID: {data['data'].get('userId')}, Version: {data['data'].get('version')}"
        else:
            return "Connection failed"
    except Exception as e:
        return f"Error: {str(e)}"


# Create LlamaIndex tools
send_email_tool = FunctionTool.from_defaults(
    fn=send_email,
    name="send_email",
    description="Send an email via ADSMedia API. Use for transactional emails like notifications, confirmations, alerts.",
)

check_suppression_tool = FunctionTool.from_defaults(
    fn=check_suppression,
    name="check_suppression",
    description="Check if an email address is suppressed before sending. Use to verify deliverability.",
)

ping_tool = FunctionTool.from_defaults(
    fn=ping,
    name="ping",
    description="Test ADSMedia API connection.",
)


def get_adsmedia_tools():
    """Get all ADSMedia tools for LlamaIndex."""
    return [send_email_tool, check_suppression_tool, ping_tool]


# Example usage
if __name__ == "__main__":
    from llama_index.core.agent import ReActAgent
    from llama_index.llms.openai import OpenAI
    
    # Initialize tools
    tools = get_adsmedia_tools()
    
    # Initialize LLM
    llm = OpenAI(model="gpt-4")
    
    # Create agent
    agent = ReActAgent.from_tools(tools, llm=llm, verbose=True)
    
    # Run
    response = agent.chat("Send a welcome email to test@example.com")
    print(response)

