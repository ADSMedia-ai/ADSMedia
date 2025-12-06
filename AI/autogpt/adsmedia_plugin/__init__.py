"""ADSMedia Plugin for AutoGPT"""

from typing import Any, Dict, List, Optional, Type, TypeVar
import requests

PromptConfig = TypeVar("PromptConfig")

API_BASE_URL = "https://api.adsmedia.live/v1"


class ADSMediaPlugin:
    """
    ADSMedia Email Plugin for AutoGPT
    Enables AutoGPT to send emails via ADSMedia API
    """

    def __init__(self):
        self.api_key = None

    def _request(self, method: str, endpoint: str, data: Optional[Dict] = None) -> Dict:
        """Make API request to ADSMedia"""
        if not self.api_key:
            raise ValueError("API key not set. Use set_api_key command first.")

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        url = f"{API_BASE_URL}{endpoint}"
        
        if method == "GET":
            response = requests.get(url, headers=headers, params=data, timeout=30)
        elif method == "POST":
            response = requests.post(url, headers=headers, json=data, timeout=30)
        else:
            raise ValueError(f"Unsupported method: {method}")

        result = response.json()
        if not result.get("success"):
            raise Exception(result.get("error", {}).get("message", "API Error"))
        
        return result.get("data", {})

    def set_api_key(self, api_key: str) -> str:
        """Set the ADSMedia API key"""
        self.api_key = api_key
        return "API key set successfully"

    def send_email(
        self,
        to: str,
        subject: str,
        html: str,
        to_name: Optional[str] = None,
        from_name: Optional[str] = None,
    ) -> Dict:
        """
        Send a single email via ADSMedia API
        
        Args:
            to: Recipient email address
            subject: Email subject line
            html: HTML content of the email
            to_name: Recipient name (optional)
            from_name: Sender display name (optional)
        
        Returns:
            Response with message_id and status
        """
        data = {"to": to, "subject": subject, "html": html}
        if to_name:
            data["to_name"] = to_name
        if from_name:
            data["from_name"] = from_name
        
        return self._request("POST", "/send", data)

    def check_suppression(self, email: str) -> Dict:
        """
        Check if an email address is suppressed
        
        Args:
            email: Email address to check
        
        Returns:
            Suppression status and reason
        """
        return self._request("GET", "/suppressions/check", {"email": email})

    def ping(self) -> Dict:
        """Test API connection"""
        return self._request("GET", "/ping")

    def get_usage(self) -> Dict:
        """Get account usage statistics"""
        return self._request("GET", "/account/usage")


# Global plugin instance
plugin = ADSMediaPlugin()


# AutoGPT command functions
def set_adsmedia_api_key(api_key: str) -> str:
    """Set ADSMedia API key. Example: set_adsmedia_api_key('your-key')"""
    return plugin.set_api_key(api_key)


def send_email_adsmedia(
    to: str,
    subject: str,
    html: str,
    to_name: str = "",
    from_name: str = "",
) -> str:
    """
    Send email via ADSMedia.
    Example: send_email_adsmedia('user@example.com', 'Hello!', '<h1>Hi!</h1>')
    """
    result = plugin.send_email(
        to=to,
        subject=subject,
        html=html,
        to_name=to_name if to_name else None,
        from_name=from_name if from_name else None,
    )
    return f"Email sent to {to}. Message ID: {result.get('message_id')}"


def check_email_suppression(email: str) -> str:
    """
    Check if email is suppressed.
    Example: check_email_suppression('user@example.com')
    """
    result = plugin.check_suppression(email)
    if result.get("suppressed"):
        return f"Email {email} is SUPPRESSED. Reason: {result.get('reason')}"
    return f"Email {email} is NOT suppressed - safe to send"


def test_adsmedia_connection() -> str:
    """Test ADSMedia API connection"""
    result = plugin.ping()
    return f"Connected! User ID: {result.get('userId')}"

