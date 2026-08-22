import asyncio
import logging
import smtplib
from email.message import EmailMessage

from app.core.config import settings

logger = logging.getLogger("dayflow.email")


def _send_sync(to_email: str, subject: str, body: str) -> None:
    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = settings.smtp_from_email
    message["To"] = to_email
    message.set_content(body)

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as smtp:
        smtp.starttls()
        if settings.smtp_username and settings.smtp_password:
            smtp.login(settings.smtp_username, settings.smtp_password)
        smtp.send_message(message)


async def send_email(to_email: str, subject: str, body: str) -> None:
    """Best-effort email send. If SMTP isn't configured (no SMTP_HOST), this
    logs and returns instead of raising, so leave/payroll actions still work
    for anyone running the app without SMTP set up (e.g. local dev)."""
    if not settings.smtp_host or not settings.smtp_from_email:
        logger.info("SMTP not configured; skipping email to %s: %s", to_email, subject)
        return

    try:
        await asyncio.to_thread(_send_sync, to_email, subject, body)
    except Exception:
        logger.exception("Failed to send email to %s: %s", to_email, subject)
