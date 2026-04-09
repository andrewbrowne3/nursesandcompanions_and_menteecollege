import os
import sqlite3
import logging
from datetime import datetime
from pathlib import Path

logger = logging.getLogger("mentee_agent.database")

# Same database as the Django app
DB_PATH = Path(os.environ.get("DB_PATH", Path(__file__).resolve().parent.parent / "menteeCollegePortal" / "menteecollegewebsite" / "db.sqlite3"))


def get_connection():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def save_message(session_id, body, author="Mentee College"):
    """Save a message to the existing Django GroupMessage table."""
    conn = get_connection()
    try:
        # Get or create the ChatGroup for this session
        row = conn.execute(
            "SELECT id FROM mentee_college_online_school_chatgroup WHERE group_name = ?",
            (session_id,)
        ).fetchone()

        if row:
            group_id = row["id"]
        else:
            conn.execute(
                "INSERT INTO mentee_college_online_school_chatgroup (group_name) VALUES (?)",
                (session_id,)
            )
            group_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]

        # Insert the message
        conn.execute(
            "INSERT INTO mentee_college_online_school_groupmessage (group_id, author, body, created) VALUES (?, ?, ?, ?)",
            (group_id, author, body[:300], datetime.now().isoformat())
        )
        conn.commit()
    except Exception as e:
        logger.error(f"Error saving message: {e}")
    finally:
        conn.close()


def save_conversation_messages(session):
    """Save all messages from a session to the database."""
    for msg in session.message_history:
        author = session.lead.name or "Anonymous" if msg["role"] == "user" else "Mentee College"
        save_message(session.session_id, msg["content"], author=author)
