"""
Embedder Worker — subscribes to doc.embed, generates embeddings via LiteLLM,
upserts into Qdrant + OpenSearch, then publishes doc.entity event.
"""
import asyncio
import json
import sys
import uuid
import nats
from sqlalchemy import select
from db import AsyncSessionLocal
from models import Document, Chunk
from services import llm, vector_store, lexical_store, messaging
from config import get_settings

settings = get_settings()
BATCH_SIZE = 32


async def handle_embed(msg):
    data = json.loads(msg.data.decode())
    doc_id = data["document_id"]

    async with AsyncSessionLocal() as db:
        doc: Document | None = await db.get(Document, doc_id)
        if not doc:
            await msg.ack()
            return

        result = await db.execute(
            select(Chunk).where(Chunk.document_id == doc.id).order_by(Chunk.chunk_index)
        )
        chunks = result.scalars().all()

        if not chunks:
            await msg.ack()
            return

        try:
            # Batch embed
            for i in range(0, len(chunks), BATCH_SIZE):
                batch = chunks[i: i + BATCH_SIZE]
                texts = [c.content for c in batch]
                vectors = await llm.embed(texts)

                qdrant_points = []
                for chunk, vector in zip(batch, vectors):
                    point_id = str(uuid.uuid4())
                    chunk.qdrant_id = point_id
                    qdrant_points.append({
                        "id": point_id,
                        "vector": vector,
                        "payload": {
                            "content": chunk.content,
                            "document_id": str(doc_id),
                            "chunk_index": chunk.chunk_index,
                            "language": doc.language,
                        },
                    })
                    # OpenSearch
                    os_id = str(chunk.id)
                    chunk.opensearch_id = os_id
                    await lexical_store.index_chunk(
                        doc_id=str(doc_id),
                        chunk_id=os_id,
                        content=chunk.content,
                        metadata={"chunk_index": chunk.chunk_index, "language": doc.language},
                    )

                await vector_store.upsert_chunks(qdrant_points)
                await db.commit()

            # Trigger entity extraction
            await messaging.publish("doc.entity", {"document_id": str(doc_id)})

            doc.status = "indexed"
            await db.commit()
            print(f"[embedder] Indexed {len(chunks)} chunks for doc {doc_id}")
        except Exception as e:
            print(f"[embedder] Error embedding {doc_id}: {e}", file=sys.stderr)
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
    print("[embedder] Subscribed to doc.embed")
    await js.subscribe("doc.embed", cb=handle_embed, durable="embedder-worker", stream="EMBED")
    try:
        while True:
            await asyncio.sleep(1)
    except KeyboardInterrupt:
        await nc.drain()


if __name__ == "__main__":
    asyncio.run(main())
