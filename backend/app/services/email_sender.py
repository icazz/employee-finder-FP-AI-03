import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import settings

logger = logging.getLogger(__name__)


def send_gmail(
    to_email: str, subject: str, content: str, sender_name: str = ""
) -> dict:
    if not settings.smtp_user or not settings.smtp_password:
        logger.warning("SMTP not configured — returning simulated send")
        return {"simulated": True, "message": "SMTP not configured"}

    name = sender_name.strip() or "CVDrop-AI"
    msg = MIMEMultipart()
    msg["From"] = f"{name} <{settings.smtp_user}>"
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.attach(MIMEText(content, "plain", "utf-8"))

    try:
        server = smtplib.SMTP(settings.smtp_host, settings.smtp_port)
        server.starttls()
        server.login(settings.smtp_user, settings.smtp_password)
        server.sendmail(settings.smtp_user, to_email, msg.as_string())
        server.quit()
        logger.info("Email sent to %s", to_email)
        return {"simulated": False, "message": "Email sent successfully"}
    except Exception as exc:
        logger.error("Failed to send email: %s", exc)
        return {"simulated": True, "message": str(exc)}
