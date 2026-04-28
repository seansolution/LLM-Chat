"""Document upload / sync / management endpoints."""
import uuid
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from db import get_db
from models import Document
from services import storage, messaging

router = APIRouter(prefix="/documents", tags=["documents"])


@router.post("", status_code=202)
async def upload_document(
    file: UploadFile = File(...),
    language: str = Form("th"),
    db: AsyncSession = Depends(get_db),
):
    """Upload a document → store in SeaweedFS → publish parse event to NATS."""
    content = await file.read()
    checksum = storage.compute_checksum(content)

    # Check for duplicate
    existing = await db.execute(select(Document).where(Document.checksum == checksum))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Document already exists (duplicate checksum)")

    doc_id = uuid.uuid4()
    storage_key = await storage.upload_file(
        filename=f"{doc_id}/{file.filename}",
        content=content,
        mime_type=file.content_type or "application/octet-stream",
    )

    doc = Document(
        id=doc_id,
        name=file.filename or "untitled",
        mime_type=file.content_type or "application/octet-stream",
        size_bytes=len(content),
        storage_key=storage_key,
        checksum=checksum,
        language=language,
        status="pending",
    )
    db.add(doc)
    await db.commit()

    # Trigger async pipeline
    await messaging.publish("doc.parse", {"document_id": str(doc_id), "storage_key": storage_key})

    return {"document_id": str(doc_id), "status": "pending", "message": "Processing started"}


@router.get("")
async def list_documents(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Document).order_by(Document.created_at.desc()).limit(100))
    docs = result.scalars().all()
    return [
        {
            "id": str(d.id),
            "name": d.name,
            "status": d.status,
            "publish_state": d.publish_state,
            "version": d.version,
            "created_at": d.created_at.isoformat(),
        }
        for d in docs
    ]


@router.patch("/{doc_id}/publish")
async def publish_document(doc_id: str, db: AsyncSession = Depends(get_db)):
    doc = await db.get(Document, uuid.UUID(doc_id))
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    doc.publish_state = "published"
    await db.commit()
    return {"document_id": doc_id, "publish_state": "published"}


@router.post("/{doc_id}/retry", status_code=202)
async def retry_document(doc_id: str, db: AsyncSession = Depends(get_db)):
    """Re-trigger the parse pipeline for a failed or pending document."""
    doc = await db.get(Document, uuid.UUID(doc_id))
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    doc.status = "pending"
    await db.commit()
    await messaging.publish("doc.parse", {"document_id": str(doc_id), "storage_key": doc.storage_key})
    return {"document_id": doc_id, "status": "pending", "message": "Reprocessing started"}


@router.delete("/{doc_id}", status_code=204)
async def delete_document(doc_id: str, db: AsyncSession = Depends(get_db)):
    doc = await db.get(Document, uuid.UUID(doc_id))
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    await db.delete(doc)
    await db.commit()
