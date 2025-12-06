"""
ADSMedia Slack Bot
Send emails via ADSMedia API from Slack

pip install slack-bolt requests
"""

import os
import requests
from slack_bolt import App
from slack_bolt.adapter.socket_mode import SocketModeHandler

# Configuration
SLACK_BOT_TOKEN = os.environ.get("SLACK_BOT_TOKEN")
SLACK_APP_TOKEN = os.environ.get("SLACK_APP_TOKEN")
ADSMEDIA_API_KEY = os.environ.get("ADSMEDIA_API_KEY")

API_BASE_URL = "https://api.adsmedia.live/v1"

# Initialize Slack app
app = App(token=SLACK_BOT_TOKEN)


def adsmedia_request(endpoint: str, method: str = "GET", data: dict = None) -> dict:
    """Make request to ADSMedia API"""
    headers = {
        "Authorization": f"Bearer {ADSMEDIA_API_KEY}",
        "Content-Type": "application/json",
    }
    
    url = f"{API_BASE_URL}{endpoint}"
    
    if method == "GET":
        response = requests.get(url, headers=headers, params=data, timeout=30)
    else:
        response = requests.post(url, headers=headers, json=data, timeout=30)
    
    return response.json()


@app.command("/email")
def handle_email_command(ack, say, command):
    """
    Handle /email slash command
    Usage: /email user@example.com Subject line | Email body here
    """
    ack()
    
    text = command.get("text", "").strip()
    
    if not text:
        say("Usage: `/email user@example.com Subject | Body`")
        return
    
    parts = text.split(" ", 1)
    if len(parts) < 2:
        say("Please provide email address and content: `/email user@example.com Subject | Body`")
        return
    
    to = parts[0]
    rest = parts[1]
    
    if "|" in rest:
        subject, body = rest.split("|", 1)
        subject = subject.strip()
        body = body.strip()
    else:
        subject = rest[:50]
        body = rest
    
    try:
        result = adsmedia_request("/send", "POST", {
            "to": to,
            "subject": subject,
            "html": f"<p>{body}</p>",
            "from_name": "Slack Bot",
        })
        
        if result.get("success"):
            say(f"✅ Email sent to {to}!\nMessage ID: `{result['data']['message_id']}`")
        else:
            say(f"❌ Failed to send: {result.get('error', 'Unknown error')}")
    except Exception as e:
        say(f"❌ Error: {str(e)}")


@app.command("/check-email")
def handle_check_command(ack, say, command):
    """
    Handle /check-email slash command
    Usage: /check-email user@example.com
    """
    ack()
    
    email = command.get("text", "").strip()
    
    if not email:
        say("Usage: `/check-email user@example.com`")
        return
    
    try:
        result = adsmedia_request("/suppressions/check", "GET", {"email": email})
        
        if result.get("success"):
            data = result.get("data", {})
            if data.get("suppressed"):
                say(f"⚠️ `{email}` is **suppressed**\nReason: {data.get('reason', 'Unknown')}")
            else:
                say(f"✅ `{email}` is NOT suppressed - safe to send!")
        else:
            say(f"❌ Error checking: {result.get('error', 'Unknown')}")
    except Exception as e:
        say(f"❌ Error: {str(e)}")


@app.command("/email-usage")
def handle_usage_command(ack, say, command):
    """Handle /email-usage slash command"""
    ack()
    
    try:
        result = adsmedia_request("/account/usage", "GET")
        
        if result.get("success"):
            data = result.get("data", {})
            say(
                f"📊 **Email Usage**\n"
                f"• Servers: {data.get('servers', 0)}\n"
                f"• Lists: {data.get('lists', 0)}\n"
                f"• Sent this month: {data.get('sent_this_month', 0)}"
            )
        else:
            say(f"❌ Error: {result.get('error', 'Unknown')}")
    except Exception as e:
        say(f"❌ Error: {str(e)}")


@app.event("message")
def handle_message(event, say):
    """Handle direct messages"""
    text = event.get("text", "").lower()
    
    if "help" in text:
        say(
            "📧 **ADSMedia Bot Commands**\n\n"
            "`/email user@example.com Subject | Body` - Send email\n"
            "`/check-email user@example.com` - Check suppression\n"
            "`/email-usage` - View usage stats"
        )


if __name__ == "__main__":
    if not all([SLACK_BOT_TOKEN, SLACK_APP_TOKEN, ADSMEDIA_API_KEY]):
        print("Missing environment variables!")
        print("Required: SLACK_BOT_TOKEN, SLACK_APP_TOKEN, ADSMEDIA_API_KEY")
        exit(1)
    
    print("Starting ADSMedia Slack Bot...")
    handler = SocketModeHandler(app, SLACK_APP_TOKEN)
    handler.start()

