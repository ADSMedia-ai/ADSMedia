"""
ADSMedia Discord Bot
Send emails via Discord slash commands

pip install discord.py requests python-dotenv
"""

import os
import discord
from discord import app_commands
import requests
from dotenv import load_dotenv

load_dotenv()

DISCORD_TOKEN = os.getenv("DISCORD_TOKEN")
ADSMEDIA_API_KEY = os.getenv("ADSMEDIA_API_KEY")
API_BASE_URL = "https://api.adsmedia.live/v1"


class ADSMediaBot(discord.Client):
    def __init__(self):
        intents = discord.Intents.default()
        super().__init__(intents=intents)
        self.tree = app_commands.CommandTree(self)

    async def setup_hook(self):
        await self.tree.sync()


client = ADSMediaBot()


def send_email_api(to: str, subject: str, html: str, from_name: str = None) -> dict:
    """Call ADSMedia API to send email."""
    payload = {"to": to, "subject": subject, "html": html}
    if from_name:
        payload["from_name"] = from_name
    
    response = requests.post(
        f"{API_BASE_URL}/send",
        headers={
            "Authorization": f"Bearer {ADSMEDIA_API_KEY}",
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=30,
    )
    return response.json()


def check_suppression_api(email: str) -> dict:
    """Check if email is suppressed."""
    response = requests.get(
        f"{API_BASE_URL}/suppressions/check",
        headers={"Authorization": f"Bearer {ADSMEDIA_API_KEY}"},
        params={"email": email},
        timeout=30,
    )
    return response.json()


def get_usage_api() -> dict:
    """Get account usage."""
    response = requests.get(
        f"{API_BASE_URL}/account/usage",
        headers={"Authorization": f"Bearer {ADSMEDIA_API_KEY}"},
        timeout=30,
    )
    return response.json()


@client.event
async def on_ready():
    print(f"✅ Logged in as {client.user}")
    print(f"📧 ADSMedia Email Bot ready!")


@client.tree.command(name="send", description="Send an email via ADSMedia")
@app_commands.describe(
    to="Recipient email address",
    subject="Email subject line",
    message="Email message (HTML supported)",
)
async def send_email(interaction: discord.Interaction, to: str, subject: str, message: str):
    await interaction.response.defer(ephemeral=True)
    
    try:
        result = send_email_api(to, subject, message)
        
        if result.get("success"):
            embed = discord.Embed(
                title="✅ Email Sent!",
                color=discord.Color.green(),
            )
            embed.add_field(name="To", value=to, inline=True)
            embed.add_field(name="Subject", value=subject, inline=True)
            embed.add_field(name="Message ID", value=result["data"]["message_id"], inline=False)
        else:
            embed = discord.Embed(
                title="❌ Failed to Send",
                description=result.get("error", "Unknown error"),
                color=discord.Color.red(),
            )
        
        await interaction.followup.send(embed=embed, ephemeral=True)
    except Exception as e:
        await interaction.followup.send(f"❌ Error: {str(e)}", ephemeral=True)


@client.tree.command(name="check", description="Check if an email is suppressed")
@app_commands.describe(email="Email address to check")
async def check_email(interaction: discord.Interaction, email: str):
    await interaction.response.defer(ephemeral=True)
    
    try:
        result = check_suppression_api(email)
        
        if result.get("success"):
            data = result["data"]
            if data.get("suppressed"):
                embed = discord.Embed(
                    title="⚠️ Email Suppressed",
                    description=f"`{email}` is suppressed",
                    color=discord.Color.orange(),
                )
                embed.add_field(name="Reason", value=data.get("reason", "Unknown"))
            else:
                embed = discord.Embed(
                    title="✅ Email OK",
                    description=f"`{email}` is not suppressed - safe to send!",
                    color=discord.Color.green(),
                )
        else:
            embed = discord.Embed(
                title="❌ Error",
                description=result.get("error", "Unknown error"),
                color=discord.Color.red(),
            )
        
        await interaction.followup.send(embed=embed, ephemeral=True)
    except Exception as e:
        await interaction.followup.send(f"❌ Error: {str(e)}", ephemeral=True)


@client.tree.command(name="usage", description="View ADSMedia account usage")
async def usage(interaction: discord.Interaction):
    await interaction.response.defer(ephemeral=True)
    
    try:
        result = get_usage_api()
        
        if result.get("success"):
            data = result["data"]
            embed = discord.Embed(
                title="📊 ADSMedia Usage",
                color=discord.Color.blue(),
            )
            embed.add_field(name="Servers", value=data.get("servers", 0), inline=True)
            embed.add_field(name="Lists", value=data.get("lists", 0), inline=True)
            embed.add_field(name="Schedules", value=data.get("schedules", 0), inline=True)
            embed.add_field(name="Sent This Month", value=data.get("sent_this_month", 0), inline=False)
        else:
            embed = discord.Embed(
                title="❌ Error",
                description=result.get("error", "Unknown error"),
                color=discord.Color.red(),
            )
        
        await interaction.followup.send(embed=embed, ephemeral=True)
    except Exception as e:
        await interaction.followup.send(f"❌ Error: {str(e)}", ephemeral=True)


@client.tree.command(name="ping", description="Test ADSMedia API connection")
async def ping(interaction: discord.Interaction):
    await interaction.response.defer(ephemeral=True)
    
    try:
        response = requests.get(
            f"{API_BASE_URL}/ping",
            headers={"Authorization": f"Bearer {ADSMEDIA_API_KEY}"},
            timeout=30,
        )
        result = response.json()
        
        if result.get("success"):
            embed = discord.Embed(
                title="✅ Connected!",
                description="ADSMedia API is working",
                color=discord.Color.green(),
            )
            embed.add_field(name="User ID", value=result["data"].get("userId", "N/A"))
            embed.add_field(name="Version", value=result["data"].get("version", "N/A"))
        else:
            embed = discord.Embed(
                title="❌ Connection Failed",
                color=discord.Color.red(),
            )
        
        await interaction.followup.send(embed=embed, ephemeral=True)
    except Exception as e:
        await interaction.followup.send(f"❌ Error: {str(e)}", ephemeral=True)


if __name__ == "__main__":
    if not DISCORD_TOKEN:
        print("❌ DISCORD_TOKEN not set")
        exit(1)
    if not ADSMEDIA_API_KEY:
        print("❌ ADSMEDIA_API_KEY not set")
        exit(1)
    
    client.run(DISCORD_TOKEN)

