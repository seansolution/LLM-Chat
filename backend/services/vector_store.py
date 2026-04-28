"""Qdrant vector store — upsert and search."""
from qdrant_client import AsyncQdrantClient
from qdrant_client.models import (
    Distance, VectorParams, PointStruct, Filter,
    FieldCondition, MatchValue, SearchRequest,
)
from config import get_settings

settings = get_settings()
_client: AsyncQdrantClient | None = None


def get_client() -> AsyncQdrantClient:
    global _client
    if _client is None:
        _client = AsyncQdrantClient(url=settings.qdrant_url)
    return _client


async def ensure_collection():
    client = get_client()
    collections = await client.get_collections()
    names = [c.name for c in collections.collections]
    if settings.qdrant_collection not in names:
        await client.create_collection(
            collection_name=settings.qdrant_collection,
            vectors_config=VectorParams(size=settings.embedding_dim, distance=Distance.COSINE),
        )


async def upsert_chunks(points: list[dict]):
    """points: [{id, vector, payload}]"""
    client = get_client()
    await ensure_collection()
    structs = [PointStruct(id=p["id"], vector=p["vector"], payload=p["payload"]) for p in points]
    await client.upsert(collection_name=settings.qdrant_collection, points=structs)


async def search(vector: list[float], top_k: int = 5, filter_doc_ids: list[str] | None = None):
    client = get_client()
    query_filter = None
    if filter_doc_ids:
        query_filter = Filter(
            must=[FieldCondition(key="document_id", match=MatchValue(any=filter_doc_ids))]
        )
    results = await client.search(
        collection_name=settings.qdrant_collection,
        query_vector=vector,
        limit=top_k,
        query_filter=query_filter,
        with_payload=True,
    )
    return [{"id": r.id, "score": r.score, "payload": r.payload} for r in results]
