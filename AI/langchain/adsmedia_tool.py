"""
ADSMedia Tool for LangChain
Send emails using ADSMedia API from LangChain agents

pip install langchain requests
"""

import os
import requests
from typing import Optional, Type
from pydantic import BaseModel, Field
from langchain.tools import BaseTool
from langchain.callbacks.manager import CallbackManagerForToolRun


class SendEmailInput(BaseModel):
    """Input schema for sending email."""
    to: str = Field(description="Recipient email address")
    subject: str = Field(description="Email subject line")
    html: str = Field(description="HTML content of the email")
    to_name: Optional[str] = Field(default=None, description="Recipient name")
    from_name: Optional[str] = Field(default=None, description="Sender display name")


class ADSMediaSendEmailTool(BaseTool):
    """Tool for sending emails via ADSMedia API."""
    
    name: str = "adsmedia_send_email"
    description: str = """Send an email via ADSMedia API. 
    Use this to send transactional emails like notifications, confirmations, alerts.
    Input should include: to (email), subject, html content.
    Optional: to_name, from_name."""
    args_schema: Type[BaseModel] = SendEmailInput
    
    api_key: str = ""
    base_url: str = "https://api.adsmedia.live/v1"
    
    def __init__(self, api_key: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.api_key = api_key or os.getenv("ADSMEDIA_API_KEY", "")
        if not self.api_key:
            raise ValueError("ADSMEDIA_API_KEY is required")
    
    def _run(
        self,
        to: str,
        subject: str,
        html: str,
        to_name: Optional[str] = None,
        from_name: Optional[str] = None,
        run_manager: Optional[CallbackManagerForToolRun] = None,
    ) -> str:
        """Send email via ADSMedia API."""
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
                f"{self.base_url}/send",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
                timeout=30,
            )
            data = response.json()
            
            if data.get("success"):
                return f"Email sent successfully! Message ID: {data['data']['message_id']}"
            else:
                return f"Error: {data.get('error', 'Unknown error')}"
        except Exception as e:
            return f"Error sending email: {str(e)}"


class CheckSuppressionInput(BaseModel):
    """Input schema for checking email suppression."""
    email: str = Field(description="Email address to check")


class ADSMediaCheckSuppressionTool(BaseTool):
    """Tool for checking if an email is suppressed."""
    
    name: str = "adsmedia_check_suppression"
    description: str = """Check if an email address is suppressed (bounced, unsubscribed, or blocked).
    Use this before sending to verify the email is deliverable."""
    args_schema: Type[BaseModel] = CheckSuppressionInput
    
    api_key: str = ""
    base_url: str = "https://api.adsmedia.live/v1"
    
    def __init__(self, api_key: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.api_key = api_key or os.getenv("ADSMEDIA_API_KEY", "")
        if not self.api_key:
            raise ValueError("ADSMEDIA_API_KEY is required")
    
    def _run(
        self,
        email: str,
        run_manager: Optional[CallbackManagerForToolRun] = None,
    ) -> str:
        """Check suppression status."""
        try:
            response = requests.get(
                f"{self.base_url}/suppressions/check",
                headers={"Authorization": f"Bearer {self.api_key}"},
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
            return f"Error checking suppression: {str(e)}"


def get_adsmedia_tools(api_key: Optional[str] = None):
    """Get all ADSMedia tools for LangChain."""
    return [
        ADSMediaSendEmailTool(api_key=api_key),
        ADSMediaCheckSuppressionTool(api_key=api_key),
    ]


# Example usage
if __name__ == "__main__":
    from langchain.agents import initialize_agent, AgentType
    from langchain.chat_models import ChatOpenAI
    
    # Initialize tools
    tools = get_adsmedia_tools()
    
    # Initialize LLM
    llm = ChatOpenAI(temperature=0)
    
    # Create agent
    agent = initialize_agent(
        tools,
        llm,
        agent=AgentType.STRUCTURED_CHAT_ZERO_SHOT_REACT_DESCRIPTION,
        verbose=True,
    )
    
    # Run
    result = agent.run("Send a welcome email to test@example.com")
    print(result)

