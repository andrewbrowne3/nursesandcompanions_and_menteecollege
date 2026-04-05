import os
import sys
import logging

import uvicorn

from .faq_loader import load_faq_collection, get_all_programs
from .rest_server import create_app

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("mentee_agent.main")


def run():
    openai_api_key = os.environ.get("OPENAI_API_KEY", "")
    request_api_key = os.environ.get("MENTEE_AGENT_API_KEY", "")
    port = int(os.environ.get("MENTEE_AGENT_PORT", "5010"))
    model = os.environ.get("MENTEE_AGENT_MODEL", "gpt-4o-mini-2024-07-18")
    force_rebuild = os.environ.get("REBUILD_EMBEDDINGS", "").lower() == "true"

    if not openai_api_key:
        logger.error("No OPENAI_API_KEY set. Export it or add to .env")
        sys.exit(1)

    # Load FAQ embeddings into ChromaDB
    logger.info("Loading FAQ embeddings...")
    faq_collection = load_faq_collection(openai_api_key, force_rebuild=force_rebuild)
    programs = get_all_programs()
    logger.info(f"Loaded {faq_collection.count()} FAQ chunks for {len(programs)} programs")

    # Create and run FastAPI app
    app = create_app(
        faq_collection=faq_collection,
        programs=programs,
        request_api_key=request_api_key,
        openai_api_key=openai_api_key,
        model=model,
    )

    print(f"Mentee College FAQ Agent running on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)


if __name__ == "__main__":
    run()
