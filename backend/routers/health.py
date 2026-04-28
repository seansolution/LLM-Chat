"""Health + readiness endpoints."""
from fastapi import APIRouter
import httpx
from config import get_settings

settings = get_settings()
router = APIRouter(tags=["health"])


@router.get("/health")
async def health():
    return {"status": "ok"}


@router.get("/ready")
async def ready():
    checks: dict[str, str] = {}

    async def ping(name: str, url: str):
        try:
            async with httpx.AsyncClient(timeout=3) as c:
                await c.get(url)
            checks[name] = "ok"
        except Exception as e:
            checks[name] = f"error: {e}"

    import asyncio
    await asyncio.gather(
        ping("qdrant", f"{settings.qdrant_url}/healthz"),
        ping("opensearch", f"{settings.opensearch_url}/_cluster/health"),
        ping("litellm", f"{settings.litellm_url}/health"),
        ping("hugegraph", f"{settings.hugegraph_url}/apis/version"),
    )

    all_ok = all(v == "ok" for v in checks.values())
    return {"status": "ready" if all_ok else "degraded", "checks": checks}
