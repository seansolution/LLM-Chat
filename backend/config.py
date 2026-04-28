from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    app_name: str = "RAG Platform API"
    debug: bool = False

    # Database
    database_url: str = "postgresql+asyncpg://rag_app:ragapppassword@localhost:5432/ragdb"

    # Vector / Search
    qdrant_url: str = "http://localhost:6333"
    qdrant_collection: str = "knowledge"
    opensearch_url: str = "http://localhost:9200"
    opensearch_index: str = "knowledge"

    # Graph
    hugegraph_url: str = "http://localhost:8080"
    hugegraph_graph: str = "hugegraph"

    # Storage
    seaweedfs_filer_url: str = "http://localhost:8888"
    seaweedfs_bucket: str = "documents"

    # Messaging
    nats_url: str = "nats://localhost:4222"

    # LLM
    litellm_url: str = "http://localhost:4000"
    litellm_api_key: str = "sk-litellm-master"
    default_model: str = "qwen3"           # maps to LM Studio Qwen3.5-9B-Q4_K_M
    embedding_model: str = "text-embedding-3-small"  # nomic-embed-text-v1.5 via LM Studio
    embedding_dim: int = 768               # nomic-embed-text-v1.5 output dim

    # Auth
    authentik_url: str = "http://localhost:9000"
    authentik_client_id: str = "rag-backend"
    authentik_client_secret: str = ""
    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60

    # Observability
    langfuse_host: str = "http://localhost:3001"
    langfuse_public_key: str = ""
    langfuse_secret_key: str = ""

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache
def get_settings() -> Settings:
    return Settings()
