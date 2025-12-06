"""
ADSMedia Telegram Bot
Send emails via Telegram commands

pip install python-telegram-bot requests python-dotenv
"""

import os
import requests
from dotenv import load_dotenv
from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes, ConversationHandler, MessageHandler, filters

load_dotenv()

TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN")
ADSMEDIA_API_KEY = os.getenv("ADSMEDIA_API_KEY")
API_BASE_URL = "https://api.adsmedia.live/v1"

# Conversation states
TO, SUBJECT, MESSAGE = range(3)


def api_request(method: str, endpoint: str, **kwargs) -> dict:
    """Make API request to ADSMedia."""
    url = f"{API_BASE_URL}{endpoint}"
    headers = {
        "Authorization": f"Bearer {ADSMEDIA_API_KEY}",
        "Content-Type": "application/json",
    }
    
    if method == "GET":
        response = requests.get(url, headers=headers, params=kwargs.get("params"), timeout=30)
    else:
        response = requests.post(url, headers=headers, json=kwargs.get("json"), timeout=30)
    
    return response.json()


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Start command."""
    await update.message.reply_text(
        "📧 *ADSMedia Email Bot*\n\n"
        "Commands:\n"
        "/send - Send an email\n"
        "/check <email> - Check suppression\n"
        "/usage - View usage stats\n"
        "/ping - Test connection",
        parse_mode="Markdown",
    )


async def ping(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Test API connection."""
    try:
        result = api_request("GET", "/ping")
        if result.get("success"):
            await update.message.reply_text(
                f"✅ *Connected!*\n"
                f"User ID: `{result['data'].get('userId')}`\n"
                f"Version: `{result['data'].get('version')}`",
                parse_mode="Markdown",
            )
        else:
            await update.message.reply_text("❌ Connection failed")
    except Exception as e:
        await update.message.reply_text(f"❌ Error: {str(e)}")


async def check(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Check email suppression."""
    if not context.args:
        await update.message.reply_text("Usage: /check <email>")
        return
    
    email = context.args[0]
    try:
        result = api_request("GET", "/suppressions/check", params={"email": email})
        if result.get("success"):
            data = result["data"]
            if data.get("suppressed"):
                await update.message.reply_text(
                    f"⚠️ *Suppressed*\n"
                    f"Email: `{email}`\n"
                    f"Reason: {data.get('reason', 'Unknown')}",
                    parse_mode="Markdown",
                )
            else:
                await update.message.reply_text(
                    f"✅ *Not Suppressed*\n"
                    f"Email `{email}` is safe to send!",
                    parse_mode="Markdown",
                )
        else:
            await update.message.reply_text(f"❌ Error: {result.get('error')}")
    except Exception as e:
        await update.message.reply_text(f"❌ Error: {str(e)}")


async def usage(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Get usage stats."""
    try:
        result = api_request("GET", "/account/usage")
        if result.get("success"):
            data = result["data"]
            await update.message.reply_text(
                f"📊 *ADSMedia Usage*\n\n"
                f"Servers: {data.get('servers', 0)}\n"
                f"Lists: {data.get('lists', 0)}\n"
                f"Schedules: {data.get('schedules', 0)}\n"
                f"Sent this month: {data.get('sent_this_month', 0)}",
                parse_mode="Markdown",
            )
        else:
            await update.message.reply_text(f"❌ Error: {result.get('error')}")
    except Exception as e:
        await update.message.reply_text(f"❌ Error: {str(e)}")


# Conversation for sending email
async def send_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Start send email conversation."""
    await update.message.reply_text("📧 *Send Email*\n\nEnter recipient email:", parse_mode="Markdown")
    return TO


async def send_to(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Get recipient email."""
    context.user_data["to"] = update.message.text
    await update.message.reply_text("Enter subject line:")
    return SUBJECT


async def send_subject(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Get subject."""
    context.user_data["subject"] = update.message.text
    await update.message.reply_text("Enter message (HTML supported):")
    return MESSAGE


async def send_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Get message and send email."""
    html = update.message.text
    to = context.user_data["to"]
    subject = context.user_data["subject"]
    
    try:
        result = api_request("POST", "/send", json={
            "to": to,
            "subject": subject,
            "html": html,
        })
        
        if result.get("success"):
            await update.message.reply_text(
                f"✅ *Email Sent!*\n\n"
                f"To: `{to}`\n"
                f"Subject: {subject}\n"
                f"Message ID: `{result['data']['message_id']}`",
                parse_mode="Markdown",
            )
        else:
            await update.message.reply_text(f"❌ Failed: {result.get('error')}")
    except Exception as e:
        await update.message.reply_text(f"❌ Error: {str(e)}")
    
    return ConversationHandler.END


async def cancel(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Cancel conversation."""
    await update.message.reply_text("Cancelled.")
    return ConversationHandler.END


def main():
    if not TELEGRAM_TOKEN:
        print("❌ TELEGRAM_TOKEN not set")
        return
    if not ADSMEDIA_API_KEY:
        print("❌ ADSMEDIA_API_KEY not set")
        return
    
    app = Application.builder().token(TELEGRAM_TOKEN).build()
    
    # Conversation handler for /send
    send_handler = ConversationHandler(
        entry_points=[CommandHandler("send", send_start)],
        states={
            TO: [MessageHandler(filters.TEXT & ~filters.COMMAND, send_to)],
            SUBJECT: [MessageHandler(filters.TEXT & ~filters.COMMAND, send_subject)],
            MESSAGE: [MessageHandler(filters.TEXT & ~filters.COMMAND, send_message)],
        },
        fallbacks=[CommandHandler("cancel", cancel)],
    )
    
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("ping", ping))
    app.add_handler(CommandHandler("check", check))
    app.add_handler(CommandHandler("usage", usage))
    app.add_handler(send_handler)
    
    print("✅ ADSMedia Telegram Bot started!")
    app.run_polling()


if __name__ == "__main__":
    main()

