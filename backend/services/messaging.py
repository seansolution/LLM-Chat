"""NATS JetStream publisher — fire-and-forget events to workers."""
import json
import nats
from nats.js import JetStreamContext
from config import get_settings

settings = get_settings()

_nc = None
_js: JetStreamContext | None = None


async def get_js() -> JetStreamContext:
    global _nc, _js
    if _js is None:
        _nc = await nats.connect(settings.nats_url)
        _js = _nc.jetstream()
        # Ensure streams exist
        for stream, subjects in [
            ("PARSE", ["doc.parse"]),
            ("EMBED", ["doc.embed"]),
            ("ENTITY", ["doc.entity"]),
        ]:
            try:
                await _js.find_stream(name=stream)
            except Exception:
                await _js.add_stream(name=stream, subjects=subjects)
    return _js


async def publish(subject: str, payload: dict):
    js = await get_js()
    await js.publish(subject, json.dumps(payload).encode())


async def close():
    global _nc, _js
    if _nc:
        await _nc.drain()
        _nc = None
        _js = None
