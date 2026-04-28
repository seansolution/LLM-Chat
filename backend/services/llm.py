"""LiteLLM gateway client — chat completions + embeddings."""
import re
import httpx
from config import get_settings

settings = get_settings()
HEADERS = {"Authorization": f"Bearer {settings.litellm_api_key}", "Content-Type": "application/json"}


def _strip_thinking(content: str) -> str:
    """
    Remove chain-of-thought reasoning from model output.
    Handles:
      1. <think>...</think> tags (standard Qwen3)
      2. ---ANSWER--- marker (our explicit separator)
      3. Plain "Thinking Process:..." text (LM Studio strips tags, leaving inner text)
    """
    # Format 1: explicit tags
    if "</think>" in content:
        return content.split("</think>", 1)[-1].strip()

    # Format 2: explicit answer marker
    if "---ANSWER---" in content:
        return content.split("---ANSWER---", 1)[-1].strip()

    # Format 3: plain thinking block — look for "Final Answer/Output/Polish" step
    if content.startswith("Thinking Process:") or content.startswith("Thinking:\n"):
        match = re.search(
            r'\n\d+\.\s+\*\*(?:Final\s+(?:Answer|Output|Response|Polish)[^*]*)\*\*[^\n]*\n+(.*)',
            content, re.DOTALL | re.IGNORECASE
        )
        if match:
            return match.group(1).strip()
        # Fallback: last non-empty paragraph after double newline
        blocks = [b.strip() for b in re.split(r'\n{2,}', content) if b.strip()]
        if len(blocks) > 1:
            return blocks[-1]

    return content


async def embed(texts: list[str]) -> list[list[float]]:
    """Return embedding vectors for a list of texts."""
    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(
            f"{settings.litellm_url}/embeddings",
            headers=HEADERS,
            json={"model": settings.embedding_model, "input": texts},
        )
        resp.raise_for_status()
        data = resp.json()
        return [item["embedding"] for item in data["data"]]


async def chat(
    messages: list[dict],
    model: str | None = None,
    temperature: float = 0.2,
    max_tokens: int = 3072,
) -> str:
    """Single chat completion, returns assistant content string (thinking stripped)."""
    async with httpx.AsyncClient(timeout=180) as client:
        resp = await client.post(
            f"{settings.litellm_url}/chat/completions",
            headers=HEADERS,
            json={
                "model": model or settings.default_model,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,

            },
        )
        resp.raise_for_status()
        content = resp.json()["choices"][0]["message"]["content"]
        return _strip_thinking(content)
