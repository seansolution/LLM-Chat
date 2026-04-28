"""
RAG Orchestrator
  1. Embed query
  2. Parallel retrieval: Qdrant (semantic) + OpenSearch (lexical) + HugeGraph (graph)
  3. Merge + deduplicate
  4. Rerank (BGM)
  5. Build prompt → LiteLLM → vLLM
  6. Return answer + citations
"""
import asyncio
import time
import uuid
from config import get_settings
from services import llm, vector_store, lexical_store, graph_store, reranker

settings = get_settings()

SYSTEM_PROMPT = """You are a helpful assistant for {company}.
Answer ONLY from the provided context.
If the answer is not in the context, say you don't know and suggest contacting support.
Always cite the source chunk IDs using [chunk_id] notation.
Respond in the same language as the user's question.

IMPORTANT: Output your final answer after the marker "---ANSWER---" on its own line. Do not include any reasoning or thinking before the marker."""


async def query(
    user_query: str,
    session_id: str | None = None,
    top_k: int = 5,
    use_graph: bool = True,
) -> dict:
    start = time.monotonic()

    # 1. Embed query
    vectors = await llm.embed([user_query])
    query_vector = vectors[0]

    # 2. Parallel retrieval
    tasks = [
        vector_store.search(query_vector, top_k=top_k * 2),
        lexical_store.search(user_query, top_k=top_k * 2),
    ]
    if use_graph:
        tasks.append(graph_store.graph_search(user_query, depth=2))

    results = await asyncio.gather(*tasks, return_exceptions=True)

    semantic_hits = results[0] if not isinstance(results[0], Exception) else []
    lexical_hits = results[1] if not isinstance(results[1], Exception) else []
    graph_hits = results[2] if use_graph and not isinstance(results[2], Exception) else []

    # 3. Merge + deduplicate by chunk id
    seen: set[str] = set()
    merged: list[dict] = []
    for hit in semantic_hits + lexical_hits:
        cid = str(hit.get("id", ""))
        if cid not in seen:
            seen.add(cid)
            merged.append(hit)

    # 4. Rerank
    reranked = await reranker.rerank(user_query, merged, top_k=top_k)

    # 5. Build context
    context_parts = []
    citations = []
    for chunk in reranked:
        cid = str(chunk.get("id", ""))
        content = chunk.get("payload", {}).get("content", "")
        context_parts.append(f"[{cid}] {content}")
        citations.append({"chunk_id": cid, "score": chunk.get("rerank_score", 0)})

    # Add graph context if available
    if graph_hits:
        graph_context = "\n".join(
            str(node.get("value", [None])[0]) for node in graph_hits[:10] if node
        )
        if graph_context:
            context_parts.append(f"[graph] {graph_context}")

    context = "\n\n".join(context_parts)

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT.format(company="SEAN")},
        {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {user_query}"},
    ]

    # 6. LLM call
    answer = await llm.chat(messages, temperature=0.2, max_tokens=2048)

    latency_ms = int((time.monotonic() - start) * 1000)

    return {
        "answer": answer,
        "citations": citations,
        "retrieval_meta": {
            "semantic_hits": len(semantic_hits),
            "lexical_hits": len(lexical_hits),
            "graph_hits": len(graph_hits) if use_graph else 0,
            "reranked": len(reranked),
        },
        "latency_ms": latency_ms,
        "session_id": session_id,
    }
