# System Architecture

User
 → Web Chat UI
 → POST /chat
 → Load Markdown knowledge
 → Prompt + Mistral (Ollama)
 → Response

## LLM
- Model: mistral
- Endpoint: http://localhost:11434

## Knowledge Source
- Local Markdown files
- No vector database (phase 1)
