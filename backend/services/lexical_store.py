"""OpenSearch lexical / hybrid index."""
from opensearchpy import AsyncOpenSearch
from config import get_settings

settings = get_settings()
_client: AsyncOpenSearch | None = None


def get_client() -> AsyncOpenSearch:
    global _client
    if _client is None:
        _client = AsyncOpenSearch(hosts=[settings.opensearch_url])
    return _client


async def ensure_index():
    client = get_client()
    exists = await client.indices.exists(index=settings.opensearch_index)
    if not exists:
        await client.indices.create(
            index=settings.opensearch_index,
            body={
                "mappings": {
                    "properties": {
                        "content": {"type": "text", "analyzer": "standard"},
                        "document_id": {"type": "keyword"},
                        "chunk_index": {"type": "integer"},
                        "language": {"type": "keyword"},
                    }
                }
            },
        )


async def index_chunk(doc_id: str, chunk_id: str, content: str, metadata: dict):
    client = get_client()
    await ensure_index()
    await client.index(
        index=settings.opensearch_index,
        id=chunk_id,
        body={"content": content, "document_id": doc_id, **metadata},
    )


async def search(query: str, top_k: int = 5) -> list[dict]:
    client = get_client()
    resp = await client.search(
        index=settings.opensearch_index,
        body={
            "query": {"match": {"content": {"query": query, "fuzziness": "AUTO"}}},
            "size": top_k,
        },
    )
    hits = resp["hits"]["hits"]
    return [{"id": h["_id"], "score": h["_score"], "payload": h["_source"]} for h in hits]
