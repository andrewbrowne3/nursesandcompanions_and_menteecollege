import logging
from typing import Optional

from fastapi import FastAPI, Query, HTTPException
from pydantic import BaseModel

from .agent import ConversationSession, start_conversation, handle_message

logger = logging.getLogger("mentee_agent.rest_server")

# In-memory session storage
sessions: dict[str, ConversationSession] = {}


class MessageRequest(BaseModel):
    session_id: str
    message: str


class StartRequest(BaseModel):
    api_key: Optional[str] = None


def create_app(faq_collection, programs, request_api_key=None,
               openai_api_key=None, model="gpt-4o-mini-2024-07-18"):
    app = FastAPI(title="Mentee College FAQ Agent")

    @app.post("/start")
    def start(req: StartRequest = None):
        """Start a new conversation. Returns the greeting message."""
        response, session = start_conversation()
        sessions[session.session_id] = session
        return response

    @app.post("/message")
    def message(req: MessageRequest, debug: bool = Query(False)):
        """Send a message within an existing conversation."""
        session = sessions.get(req.session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found. Call /start first.")

        response = handle_message(
            session=session,
            user_message=req.message,
            faq_collection=faq_collection,
            programs=programs,
            api_key=openai_api_key,
            model=model,
        )

        if debug:
            response["message_history"] = session.message_history

        return response

    @app.get("/session/{session_id}")
    def get_session(session_id: str):
        """Get the current state of a conversation session."""
        session = sessions.get(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found.")
        return {
            "session_id": session.session_id,
            "phase": session.phase,
            "lead": session.lead.model_dump(),
            "message_count": len(session.message_history),
        }

    @app.get("/programs")
    def list_programs():
        return {"programs": programs}

    @app.get("/health")
    def health():
        return {"status": "ok", "collection_count": faq_collection.count()}

    return app
