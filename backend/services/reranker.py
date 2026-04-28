"""BGM Reranker — score and rerank retrieved chunks using LLM cross-encoder prompt."""
from services.llm import chat


RERANK_PROMPT = """You are a relevance scorer. Given a query and a passage, output a single float score between 0.0 and 1.0 indicating how relevant the passage is to the query. Output ONLY the number.

Query: {query}
Passage: {passage}
Score:"""


async def rerank(query: str, candidates: list[dict], top_k: int = 3) -> list[dict]:
    """
    candidates: list of {id, score, payload: {content, ...}}
    Returns top_k candidates sorted by rerank score.
    """
    if not candidates:
        return []

    scored = []
    for c in candidates:
        content = c.get("payload", {}).get("content", "")
        prompt = RERANK_PROMPT.format(query=query, passage=content[:800])
        try:
            raw = await chat(
                messages=[{"role": "user", "content": prompt}],
                temperature=0.0,
                max_tokens=5,
            )
            score = float(raw.strip().split()[0])
        except Exception:
            score = c.get("score", 0.0)
        scored.append({**c, "rerank_score": score})

    scored.sort(key=lambda x: x["rerank_score"], reverse=True)
    return scored[:top_k]
