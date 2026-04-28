"""
Parser Worker — subscribes to doc.parse, downloads from SeaweedFS,
parses PDF/DOCX/MD, chunks text, stores chunks in PostgreSQL,
then publishes doc.embed event.
"""
import asyncio
import json
import sys
import io
import nats
from nats.js.api import ConsumerConfig, DeliverPolicy
from sqlalchemy.ext.asyncio import AsyncSession
from db import AsyncSessionLocal
from models import Document, Chunk
from services.storage import download_file
from config import get_settings

settings = get_settings()

CHUNK_SIZE = 512   # words approx
CHUNK_OVERLAP = 64


def chunk_text(text: str, size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    """
    Word-boundary chunker — pure Python, no Rust deps.
    Works on arm64 without any native extensions.
    """
    words = text.split()
    if not words:
        return []
    chunks, i = [], 0
    while i < len(words):
        chunk = " ".join(words[i: i + size])
        chunks.append(chunk)
        i += size - overlap
    return [c for c in chunks if c.strip()]


def parse_content(content: bytes, mime_type: str) -> str:
    if mime_type == "application/pdf":
        from pypdf import PdfReader
        reader = PdfReader(io.BytesIO(content))
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    elif mime_type in ("application/vnd.openxmlformats-officedocument.wordprocessingml.document",):
        from docx import Document as DocxDocument
        doc = DocxDocument(io.BytesIO(content))
        return "\n".join(p.text for p in doc.paragraphs)
    else:
        # Markdown / plain text
        return content.decode("utf-8", errors="replace")


async def handle_parse(msg):
    data = json.loads(msg.data.decode())
    doc_id = data["document_id"]
    storage_key = data["storage_key"]

    async with AsyncSessionLocal() as db:
        doc: Document | None = await db.get(Document, doc_id)
        if not doc:
            await msg.ack()
            return

        doc.status = "processing"
        await db.commit()

        try:
            content = await download_file(storage_key)
            text = parse_content(content, doc.mime_type)
            chunks = chunk_text(text)

            for idx, chunk_text_ in enumerate(chunks):
                chunk = Chunk(
                    document_id=doc.id,
                    chunk_index=idx,
                    content=chunk_text_,
                    token_count=len(chunk_text_.split()),
                    metadata_={"language": doc.language},
                )
                db.add(chunk)

            await db.commit()

            # Trigger embedding
            from services.messaging import publish
            await publish("doc.embed", {"document_id": str(doc_id)})

            doc.status = "parsed"
            await db.commit()
        except Exception as e:
            print(f"[parser] Error processing {doc_id}: {e}", file=sys.stderr)
            doc.status = "failed"
            await db.commit()

    await msg.ack()


async def main():
    nc = await nats.connect(settings.nats_url)
    js = nc.jetstream()
    # Ensure stream exists (idempotent) — must match messaging.py stream names
    for stream, subjects in [("PARSE", ["doc.parse"]), ("EMBED", ["doc.embed"]), ("ENTITY", ["doc.entity"])]:
        try:
            await js.find_stream(name=stream)
        except Exception:
            await js.add_stream(name=stream, subjects=subjects)
    print("[parser] Subscribed to doc.parse")
    await js.subscribe("doc.parse", cb=handle_parse, durable="parser-worker", stream="PARSE")
    try:
        while True:
            await asyncio.sleep(1)
    except KeyboardInterrupt:
        await nc.drain()


if __name__ == "__main__":
    asyncio.run(main())
