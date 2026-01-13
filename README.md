# Mistral Mini Chat (Next Server)

Minimal Next.js (App Router) project that demonstrates a server-side-only RAG (Retrieval-Augmented Generation) system using Mistral via Ollama. The web UI is SSR for initial load and uses a client component for chat interactions.

## Features

- **RAG System**: Loads knowledge from multiple Markdown files
- **Local LLM**: Uses Mistral 7B via Ollama for local inference
- **Thai Language Support**: Optimized for Thai business law and services knowledge
- **Knowledge Base**: Comprehensive knowledge about accounting, tax, company registration, work permits, and services
- **Quality Assurance**: Safety gates, quality dashboard, A/B testing, chat log schema
- **AI Maturity**: Level 4 (Adaptive - Learning & Optimization) ✅
  - **Current State**: 
    - Level 2 (Structured) complete ✅
    - Level 3 (Intelligent) complete ✅ (persona routing ✅, context/multi-turn ✅, conversation summarization ✅)
    - Level 4 (Adaptive) complete ✅
  - **Level 2 Capabilities**: ✅ Intent detection, persona routing, A/B testing, safety gates, quality monitoring
  - **Level 4 Capabilities**: ✅ 
    - Feedback collection integrated with chat flow
    - Auto-optimization activated (using optimization decisions)
    - Continuous improvement loop (scheduler + API endpoint)
  - **Next Target**: Level 5 (Autonomous) - Self-improvement and anomaly detection
  - **See**: [AI Maturity Roadmap](app/api/chat/AI_MATURITY_ROADMAP.md) and [Level 4 Activation](app/api/chat/LEVEL_4_ACTIVATION.md) for details

## Prerequisites

- Node.js >= 18
- Ollama running at http://localhost:11434
- Mistral model installed in Ollama:
  ```bash
  ollama pull mistral
  ```

## Installation

```bash
pnpm install
```

## Import Knowledge Data (Optional)

If you have CSV files with knowledge chunks and services, you can import them:

```bash
# Import knowledge chunks from CSV
node scripts/import-knowledge.js

# Import services from CSV
node scripts/import-services.js
```

**Note**: Update the CSV file paths in the scripts if your files are in a different location.

## Running the Project

```bash
pnpm dev
```

The application will be available at http://localhost:3000

## Project Structure

```
mini-llm/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts          # API endpoint that loads knowledge and calls Ollama
│   ├── components/
│   │   └── ClientChat.tsx        # Client-side chat UI component
│   ├── knowledge/                # Knowledge base (Markdown files)
│   │   ├── company.md            # Company information
│   │   ├── services.md           # Service offerings
│   │   ├── th/                   # Thai knowledge files
│   │   │   ├── accounting-*.md
│   │   │   ├── tax-*.md
│   │   │   ├── company-*.md
│   │   │   ├── work-permit-*.md
│   │   │   └── ...
│   │   └── en/                   # English knowledge files
│   │       └── ...
│   ├── page.tsx                   # Main SSR page
│   └── layout.tsx
├── scripts/
│   ├── import-knowledge.js        # Script to import knowledge chunks from CSV
│   └── import-services.js         # Script to import services from CSV
└── README.md
```

## How It Works

1. **Knowledge Loading**: The API route (`app/api/chat/route.ts`) recursively loads all Markdown files from the `app/knowledge/` directory
2. **Context Management**: Knowledge is trimmed to fit within the context window (2048 tokens) while preserving complete sections
3. **Prompt Engineering**: A strict system prompt instructs Mistral to only answer from the provided knowledge base
4. **Response Generation**: Mistral generates responses based on the loaded knowledge

## Configuration

### Ollama Settings

The system uses the following Ollama configuration:
- **Model**: `mistral`
- **Endpoint**: `http://localhost:11434/api/generate`
- **Context Window**: 2048 tokens
- **Temperature**: 0.2 (for more deterministic responses)
- **Streaming**: Disabled

### Knowledge Base

- Knowledge files are stored as Markdown (`.md`) files
- Files are organized by language (`th/`, `en/`) and topic
- The system automatically loads all Markdown files recursively
- Knowledge is limited to ~1600 characters to fit within the context window

## Knowledge Base Topics

### Thai (th/)
- **Accounting**: audit, monthly-bookkeeping, year-end-closing, accounting-compliance
- **Tax**: vat, withholding-tax, corporate-income-tax, personal-tax-owner, tax-basic
- **Company Registration**: company-borjor, partnership-horjor, sole-proprietor, comparison
- **Work Permit**: overview, requirements, restrictions, work-permit-visa
- **Other**: boi, business-license, glossary, packages-and-pricing

### English (en/)
- Company registration, VAT, Work permit overview

## API Endpoint

### POST /api/chat

Sends a message to the chat API and receives a response from Mistral.

**Request Body:**
```json
{
  "message": "VAT คืออะไร?"
}
```

**Response:**
```json
{
  "reply": "ภาษีมูลค่าเพิ่ม (VAT) คือภาษีที่เก็บจากมูลค่าที่เพิ่มขึ้น..."
}
```

## Development

### Adding New Knowledge

1. Create a new Markdown file in `app/knowledge/th/` or `app/knowledge/en/`
2. The file will be automatically loaded on the next API request
3. Ensure content is clear and well-structured for best results

### Modifying the Prompt

Edit the `systemPrompt` in `app/api/chat/route.ts` to adjust how Mistral responds.

### Adjusting Context Window

Modify `maxKnowledgeLength` in `app/api/chat/route.ts` to adjust how much knowledge is loaded (default: 1600 characters).

## Limitations

- Knowledge is limited by the context window size (2048 tokens)
- Large knowledge bases may be truncated
- No vector database or semantic search (phase 1)
- All knowledge is loaded on each request (not optimized for large knowledge bases)

## Troubleshooting

### Ollama Connection Error
- Ensure Ollama is running: `ollama serve`
- Check that Mistral model is installed: `ollama list`
- Verify the endpoint: `curl http://localhost:11434/api/generate`

### Knowledge Not Loading
- Check file permissions in `app/knowledge/`
- Verify Markdown files have `.md` extension
- Check server logs for file reading errors

## License

MIT
