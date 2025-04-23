from ..models.user import User
from ..extensions import db
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

def send_notification(user_id: int, notification_type: str, message: str):
    """
    Send a notification to a user via email and store it in the database.
    
    Args:
        user_id: The ID of the user to notify
        notification_type: The type of notification (e.g., 'new_bid', 'outbid', 'auction_won')
        message: The notification message
    """
    user = User.query.get(user_id)
    if not user or not user.email:
        return
    
    # Store notification in database
    user.notifications.append({
        'type': notification_type,
        'message': message,
        'read': False
    })
    db.session.commit()
    
    # Send email notification
    send_email_notification(user.email, message)

def send_email_notification(to_email: str, message: str):
    """
    Send an email notification to a user.
    
    Args:
        to_email: The recipient's email address
        message: The email message content
    """
    # Get email configuration from environment variables
    smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
    smtp_port = int(os.getenv('SMTP_PORT', 587))
    smtp_username = os.getenv('SMTP_USERNAME')
    smtp_password = os.getenv('SMTP_PASSWORD')
    
    if not all([smtp_server, smtp_port, smtp_username, smtp_password]):
        print("Email configuration missing. Skipping email notification.")
        return
    
    # Create email message
    msg = MIMEMultipart()
    msg['From'] = smtp_username
    msg['To'] = to_email
    msg['Subject'] = "TigerPop Notification"
    
    msg.attach(MIMEText(message, 'plain'))
    
    try:
        # Connect to SMTP server and send email
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(smtp_username, smtp_password)
        server.send_message(msg)
        server.quit()
    except Exception as e:
        print(f"Failed to send email notification: {e}") 