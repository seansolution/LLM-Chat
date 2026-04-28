"""HugeGraph client — entity/relation upsert and graph traversal."""
import httpx
from config import get_settings

settings = get_settings()
BASE = f"{settings.hugegraph_url}/apis/gremlin"


async def _gremlin(query: str, bindings: dict | None = None) -> dict:
    payload = {"gremlin": query, "bindings": bindings or {}, "language": "gremlin-groovy", "aliases": {}}
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(BASE, json=payload)
        resp.raise_for_status()
        return resp.json()


async def upsert_entity(entity_id: str, entity_type: str, value: str, props: dict | None = None) -> str:
    """Add or update a vertex. Returns vertex ID."""
    props_str = ", ".join(f"'{k}', '{v}'" for k, v in (props or {}).items())
    query = (
        f"g.V().has('entity', 'entity_id', '{entity_id}').fold()"
        f".coalesce(unfold(), addV('entity')"
        f".property('entity_id', '{entity_id}')"
        f".property('entity_type', '{entity_type}')"
        f".property('value', '{value}')"
        + (f".property({props_str})" if props_str else "")
        + ")"
    )
    result = await _gremlin(query)
    return entity_id


async def upsert_relation(from_id: str, to_id: str, relation: str):
    """Add edge between two entities."""
    query = (
        f"g.V().has('entity', 'entity_id', '{from_id}').as('a')"
        f".V().has('entity', 'entity_id', '{to_id}').as('b')"
        f".coalesce(__.select('a').outE('{relation}').where(inV().as('b')), "
        f"addE('{relation}').from('a').to('b'))"
    )
    await _gremlin(query)


async def graph_search(entity_value: str, depth: int = 2) -> list[dict]:
    """Traverse graph from entity, return related nodes."""
    query = (
        f"g.V().has('entity', 'value', '{entity_value}')"
        f".repeat(both().simplePath()).times({depth}).dedup()"
        f".valueMap(true).limit(50)"
    )
    result = await _gremlin(query)
    return result.get("result", {}).get("data", [])
