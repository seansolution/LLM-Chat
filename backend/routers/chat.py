"""POST /chat — RAG query endpoint."""
import uuid
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from db import get_db
from models import QueryLog
from services import rag
from config import get_settings

settings = get_settings()
router = APIRouter(prefix="/chat", tags=["chat"])


class ChatRequest(BaseModel):
    message: str
    session_id: str | None = None
    use_graph: bool = True
    top_k: int = 5


class ChatResponse(BaseModel):
    reply: str
    citations: list[dict]
    retrieval_meta: dict
    latency_ms: int
    session_id: str


@router.post("", response_model=ChatResponse)
async def chat(req: ChatRequest, db: AsyncSession = Depends(get_db)):
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="message is required")

    session_id = req.session_id or f"session-{uuid.uuid4().hex[:8]}"

    result = await rag.query(
        user_query=req.message,
        session_id=session_id,
        top_k=req.top_k,
        use_graph=req.use_graph,
    )

    # Persist query log
    log = QueryLog(
        session_id=session_id,
        query=req.message,
        answer=result["answer"],
        citations=result["citations"],
        retrieval_meta=result["retrieval_meta"],
        latency_ms=result["latency_ms"],
        model=settings.default_model,
    )
    db.add(log)
    await db.commit()

    return ChatResponse(
        reply=result["answer"],
        citations=result["citations"],
        retrieval_meta=result["retrieval_meta"],
        latency_ms=result["latency_ms"],
        session_id=session_id,
    )
