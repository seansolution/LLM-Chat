"""SeaweedFS filer client — upload / download documents."""
import hashlib
import httpx
from config import get_settings

settings = get_settings()


async def upload_file(filename: str, content: bytes, mime_type: str) -> str:
    """Upload to SeaweedFS filer via multipart/form-data, return storage path."""
    path = f"/{settings.seaweedfs_bucket}/{filename}"
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{settings.seaweedfs_filer_url}{path}",
            files={"file": (filename.split("/")[-1], content, mime_type)},
            timeout=60,
        )
        resp.raise_for_status()
    return path


async def download_file(storage_key: str) -> bytes:
    """Download file bytes from SeaweedFS filer."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{settings.seaweedfs_filer_url}{storage_key}",
            timeout=60,
        )
        resp.raise_for_status()
        return resp.content


def compute_checksum(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()
