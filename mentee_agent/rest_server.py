import json
import logging
from typing import Optional

from fastapi import FastAPI, Query, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .agent import ConversationSession, start_conversation, handle_message
from .database import save_message

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

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ─── WebSocket endpoint ───

    @app.websocket("/ws/chat/")
    async def websocket_chat(ws: WebSocket):
        await ws.accept()
        logger.info("WebSocket connection established")

        try:
            # Wait for the first message to get the page context
            logger.info("Waiting for page context...")
            first_data = await ws.receive_text()
            logger.info(f"First message: {first_data[:100]}")
            page = "/"
            try:
                first_parsed = json.loads(first_data)
                page = first_parsed.get("page", "/")
            except (json.JSONDecodeError, AttributeError):
                pass

            # Start conversation with page awareness
            response, session = start_conversation(page=page)
            greeting = {
                "type": "bot_message",
                "message": response["message"],
            }
            if response.get("options"):
                greeting["options"] = response["options"]
            logger.info(f"Sending greeting for page {page}: {greeting['message'][:50]}...")
            await ws.send_text(json.dumps(greeting))
            logger.info("Greeting sent successfully")

            while True:
                logger.info("Waiting for message...")
                data = await ws.receive_text()
                logger.info(f"Received: {data[:100]}")

                try:
                    parsed = json.loads(data)
                    user_message = parsed.get("message", "").strip()
                    msg_page = parsed.get("page", None)
                except (json.JSONDecodeError, AttributeError):
                    user_message = data.strip()
                    msg_page = None

                if not user_message:
                    continue

                result = handle_message(
                    session=session,
                    user_message=user_message,
                    faq_collection=faq_collection,
                    programs=programs,
                    api_key=openai_api_key,
                    model=model,
                    page=msg_page,
                )

                save_message(session.session_id, user_message, author=session.lead.name or "Anonymous")
                save_message(session.session_id, result["message"], author="Mentee College")

                reply = {
                    "type": "bot_message",
                    "message": result["message"],
                }
                if result.get("options"):
                    reply["options"] = result["options"]
                if result.get("navigate_to"):
                    reply["navigate_to"] = result["navigate_to"]

                await ws.send_text(json.dumps(reply))
                logger.info(f"Sent reply: {result['message'][:50]}...")

        except WebSocketDisconnect:
            logger.info(f"WebSocket disconnected (session {getattr(session, 'session_id', 'unknown')})")
        except Exception as e:
            logger.error(f"WebSocket error: {e}", exc_info=True)
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

        save_message(session.session_id, req.message, author=session.lead.name or "Anonymous")
        save_message(session.session_id, response["message"], author="Mentee College")

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
