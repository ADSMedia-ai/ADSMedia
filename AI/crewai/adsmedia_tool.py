"""
ADSMedia Tool for CrewAI
Send emails using ADSMedia API from CrewAI agents

pip install crewai requests
"""

import os
import requests
from typing import Optional
from crewai_tools import BaseTool


class ADSMediaSendEmailTool(BaseTool):
    """Tool for sending emails via ADSMedia API."""
    
    name: str = "Send Email"
    description: str = """Send an email via ADSMedia API.
    Useful for sending notifications, confirmations, alerts, and other transactional emails.
    
    Arguments:
    - to: Recipient email address (required)
    - subject: Email subject line (required)  
    - html: HTML content of the email (required)
    - to_name: Recipient name (optional)
    - from_name: Sender display name (optional)
    """
    
    def __init__(self, api_key: Optional[str] = None):
        super().__init__()
        self.api_key = api_key or os.getenv("ADSMEDIA_API_KEY", "")
        if not self.api_key:
            raise ValueError("ADSMEDIA_API_KEY is required")
        self.base_url = "https://api.adsmedia.live/v1"
    
    def _run(
        self,
        to: str,
        subject: str,
        html: str,
        to_name: Optional[str] = None,
        from_name: Optional[str] = None,
    ) -> str:
        """Execute the tool."""
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
                return f"✅ Email sent successfully to {to}! Message ID: {data['data']['message_id']}"
            else:
                return f"❌ Error: {data.get('error', 'Unknown error')}"
        except Exception as e:
            return f"❌ Error sending email: {str(e)}"


class ADSMediaCheckSuppressionTool(BaseTool):
    """Tool for checking email suppression status."""
    
    name: str = "Check Email Suppression"
    description: str = """Check if an email address is suppressed (bounced, unsubscribed, or blocked).
    Use before sending to verify deliverability.
    
    Arguments:
    - email: Email address to check (required)
    """
    
    def __init__(self, api_key: Optional[str] = None):
        super().__init__()
        self.api_key = api_key or os.getenv("ADSMEDIA_API_KEY", "")
        if not self.api_key:
            raise ValueError("ADSMEDIA_API_KEY is required")
        self.base_url = "https://api.adsmedia.live/v1"
    
    def _run(self, email: str) -> str:
        """Execute the tool."""
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
                    return f"⚠️ {email} is SUPPRESSED - Reason: {data['data'].get('reason', 'Unknown')}"
                return f"✅ {email} is NOT suppressed - safe to send"
            else:
                return f"❌ Error: {data.get('error', 'Unknown error')}"
        except Exception as e:
            return f"❌ Error: {str(e)}"


def get_adsmedia_tools(api_key: Optional[str] = None):
    """Get all ADSMedia tools for CrewAI."""
    return [
        ADSMediaSendEmailTool(api_key=api_key),
        ADSMediaCheckSuppressionTool(api_key=api_key),
    ]


# Example usage
if __name__ == "__main__":
    from crewai import Agent, Task, Crew
    
    # Create tools
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
        description="Send a welcome email to test@example.com",
        agent=email_agent,
        expected_output="Confirmation that the email was sent",
    )
    
    # Run crew
    crew = Crew(agents=[email_agent], tasks=[task])
    result = crew.kickoff()
    print(result)

