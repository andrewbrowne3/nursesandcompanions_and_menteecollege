import logging
from pathlib import Path

from bs4 import BeautifulSoup
import chromadb
from chromadb.utils import embedding_functions

logger = logging.getLogger("mentee_agent.faq_loader")

FAQ_DIR = Path(__file__).resolve().parent.parent / "MenteeCollege"
CHROMA_DIR = Path(__file__).resolve().parent / "chroma_db"

PROGRAM_MAP = {
    "CPR_FAQ.html": {
        "program": "CPR",
        "full_name": "CPR & BLS Certification",
    },
    "CNA_FAQ.html": {
        "program": "CNA",
        "full_name": "Certified Nursing Assistant",
    },
    "EKG_FAQ.html": {
        "program": "EKG",
        "full_name": "EKG Technician",
    },
    "Phlebotomy_FAQ.html": {
        "program": "Phlebotomy",
        "full_name": "Phlebotomy Technician",
    },
    "PCT_FAQ.html": {
        "program": "PCT",
        "full_name": "Patient Care Technician",
    },
    "MedicationAide_FAQ.html": {
        "program": "Medication Aide",
        "full_name": "Medication Aide",
    },
    "MA(certificate)_FAQ.html": {
        "program": "MA Certificate",
        "full_name": "Medical Assistant Certificate",
    },
    "MA(associate)_FAQ.html": {
        "program": "MA Associate",
        "full_name": "Associate of Applied Science in Medical Assistant",
    },
    "PN_FAQ.html": {
        "program": "PN",
        "full_name": "Practical Nursing",
    },
    "SonographyFAQ.html": {
        "program": "Sonography",
        "full_name": "Diagnostic Medical Sonography",
    },
}


def parse_faq_html(filepath):
    """Extract text content from an FAQ HTML file, split into meaningful sections."""
    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
        soup = BeautifulSoup(f.read(), "html.parser")

    # Remove nav, header, footer, scripts
    for tag in soup.find_all(["nav", "header", "footer", "script", "style"]):
        tag.decompose()

    sections = []
    current_section = None

    for element in soup.find_all(["h1", "h2", "h3", "p", "li", "strong"]):
        text = element.get_text(strip=True)
        if not text:
            continue

        if element.name in ("h1", "h2", "h3"):
            if current_section:
                sections.append(current_section)
            current_section = {"heading": text, "content": []}
        elif current_section is not None:
            current_section["content"].append(text)
        else:
            current_section = {"heading": "General", "content": [text]}

    if current_section:
        sections.append(current_section)

    return sections


def build_chunks(faq_dir=None):
    """Parse all FAQ HTML files and return a list of (text, metadata) chunks."""
    faq_dir = Path(faq_dir) if faq_dir else FAQ_DIR
    chunks = []

    for filename, program_info in PROGRAM_MAP.items():
        filepath = faq_dir / filename
        if not filepath.exists():
            logger.warning(f"FAQ file not found: {filepath}")
            continue

        sections = parse_faq_html(filepath)
        program = program_info["program"]
        full_name = program_info["full_name"]

        for section in sections:
            heading = section["heading"]
            content = "\n".join(section["content"])
            if not content.strip():
                continue

            chunk_text = f"Program: {full_name} ({program})\nSection: {heading}\n{content}"
            metadata = {
                "program": program,
                "full_name": full_name,
                "section": heading,
                "source_file": filename,
            }
            chunks.append((chunk_text, metadata))

        # Also add a full-program summary chunk
        all_text = "\n".join(
            f"{s['heading']}: {' '.join(s['content'])}" for s in sections if s["content"]
        )
        summary_text = f"Program: {full_name} ({program})\nFull Summary:\n{all_text}"
        chunks.append((summary_text, {
            "program": program,
            "full_name": full_name,
            "section": "Full Summary",
            "source_file": filename,
        }))

    logger.info(f"Built {len(chunks)} chunks from {len(PROGRAM_MAP)} FAQ files")
    return chunks


def load_faq_collection(openai_api_key, faq_dir=None, force_rebuild=False):
    """Load or build the ChromaDB collection with FAQ embeddings."""
    chroma_client = chromadb.PersistentClient(path=str(CHROMA_DIR))
    openai_ef = embedding_functions.OpenAIEmbeddingFunction(
        api_key=openai_api_key,
        model_name="text-embedding-3-small",
    )

    existing = [c.name for c in chroma_client.list_collections()]
    if "mentee_faq" in existing and not force_rebuild:
        collection = chroma_client.get_collection("mentee_faq", embedding_function=openai_ef)
        if collection.count() > 0:
            logger.info(f"Loaded existing ChromaDB collection with {collection.count()} documents")
            return collection
        # Collection exists but is empty, rebuild
        chroma_client.delete_collection("mentee_faq")

    if "mentee_faq" in existing and force_rebuild:
        chroma_client.delete_collection("mentee_faq")

    collection = chroma_client.create_collection(
        name="mentee_faq",
        embedding_function=openai_ef,
    )

    chunks = build_chunks(faq_dir)
    if not chunks:
        logger.error("No FAQ chunks were built. Check FAQ_DIR path.")
        return collection

    documents = [c[0] for c in chunks]
    metadatas = [c[1] for c in chunks]
    ids = [f"chunk_{i}" for i in range(len(chunks))]

    collection.add(documents=documents, metadatas=metadatas, ids=ids)
    logger.info(f"Built ChromaDB collection with {len(chunks)} documents")

    return collection


def get_all_programs():
    """Return a list of all program names and their short codes."""
    return [
        {"program": v["program"], "full_name": v["full_name"]}
        for v in PROGRAM_MAP.values()
    ]
