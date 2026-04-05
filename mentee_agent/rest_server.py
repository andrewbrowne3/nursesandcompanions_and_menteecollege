import json
import logging
from typing import Optional

from fastapi import FastAPI, Query, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel

from .agent import ConversationSession, start_conversation, handle_message

logger = logging.getLogger("mentee_agent.rest_server")

# In-memory session storage (for HTTP endpoints)
sessions: dict[str, ConversationSession] = {}


class MessageRequest(BaseModel):
    session_id: str
    message: str


class StartRequest(BaseModel):
    api_key: Optional[str] = None


def create_app(faq_collection, programs, request_api_key=None,
               openai_api_key=None, model="gpt-4o-mini-2024-07-18"):
    app = FastAPI(title="Mentee College FAQ Agent")

    # ─── WebSocket endpoint ───

    @app.websocket("/ws/chat/")
    async def websocket_chat(ws: WebSocket):
        await ws.accept()
        logger.info("WebSocket connection established")

        # Start conversation and send greeting
        response, session = start_conversation()
        await ws.send_json({
            "type": "bot_message",
            "message": response["message"],
            "options": response.get("options"),
        })

        try:
            while True:
                data = await ws.receive_text()
                try:
                    parsed = json.loads(data)
                    user_message = parsed.get("message", "").strip()
                except (json.JSONDecodeError, AttributeError):
                    user_message = data.strip()

                if not user_message:
                    continue

                result = handle_message(
                    session=session,
                    user_message=user_message,
                    faq_collection=faq_collection,
                    programs=programs,
                    api_key=openai_api_key,
                    model=model,
                )

                reply = {
                    "type": "bot_message",
                    "message": result["message"],
                }
                if result.get("options"):
                    reply["options"] = result["options"]
                if result.get("navigate_to"):
                    reply["navigate_to"] = result["navigate_to"]

                await ws.send_json(reply)

        except WebSocketDisconnect:
            logger.info(f"WebSocket disconnected (session {session.session_id})")
        except Exception as e:
            logger.error(f"WebSocket error: {e}")
            try:
                await ws.close()
            except Exception:
                pass

    # ─── HTTP endpoints ───

    @app.post("/start")
    def start(req: StartRequest = None):
        response, session = start_conversation()
        sessions[session.session_id] = session
        return response

    @app.post("/message")
    def message(req: MessageRequest, debug: bool = Query(False)):
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
