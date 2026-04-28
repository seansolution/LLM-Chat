"""
Entity Extractor Worker — subscribes to doc.entity, uses LLM to extract
named entities from chunks, upserts into HugeGraph.
"""
import asyncio
import json
import sys
import nats
from sqlalchemy import select
from db import AsyncSessionLocal
from models import Document, Chunk
from services import llm, graph_store
from config import get_settings

settings = get_settings()

EXTRACT_PROMPT = """Extract named entities from the following text.
Return a JSON array of objects with keys: "type" (one of: ORG, PERSON, LAW, TAX_CODE, LOCATION, PRODUCT, OTHER) and "value".
Return ONLY the JSON array, no explanation.

Text: {text}"""


async def extract_entities(text: str) -> list[dict]:
    try:
        raw = await llm.chat(
            messages=[{"role": "user", "content": EXTRACT_PROMPT.format(text=text[:1000])}],
            temperature=0.0,
            max_tokens=256,
        )
        # Parse JSON from response
        start = raw.find("[")
        end = raw.rfind("]") + 1
        if start >= 0 and end > start:
            return json.loads(raw[start:end])
    except Exception as e:
        print(f"[entity] Extract error: {e}", file=sys.stderr)
    return []


async def handle_entity(msg):
    data = json.loads(msg.data.decode())
    doc_id = data["document_id"]

    async with AsyncSessionLocal() as db:
        doc: Document | None = await db.get(Document, doc_id)
        if not doc:
            await msg.ack()
            return

        result = await db.execute(
            select(Chunk).where(Chunk.document_id == doc.id).limit(50)  # sample first 50 chunks
        )
        chunks = result.scalars().all()

        entity_map: dict[str, dict] = {}  # value → entity

        for chunk in chunks:
            entities = await extract_entities(chunk.content)
            for ent in entities:
                key = f"{ent['type']}:{ent['value']}"
                if key not in entity_map:
                    entity_map[key] = ent
                    eid = f"{doc_id}:{key}"
                    try:
                        await graph_store.upsert_entity(
                            entity_id=eid,
                            entity_type=ent["type"],
                            value=ent["value"],
                            props={"document_id": str(doc_id)},
                        )
                    except Exception as e:
                        print(f"[entity] Graph upsert error: {e}", file=sys.stderr)

        print(f"[entity] Extracted {len(entity_map)} entities for doc {doc_id}")

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
    print("[entity] Subscribed to doc.entity")
    await js.subscribe("doc.entity", cb=handle_entity, durable="entity-worker", stream="ENTITY")
    try:
        while True:
            await asyncio.sleep(1)
    except KeyboardInterrupt:
        await nc.drain()


if __name__ == "__main__":
    asyncio.run(main())
