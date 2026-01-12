# Coding Rules

## Tech Stack
- Node.js
- Express
- JavaScript (ESM)
- Package manager: pnpm

## Rules
- เขียนโค้ดให้อ่านง่าย
- หลีกเลี่ยง abstraction เกินจำเป็น
- ไม่ใช้ framework เพิ่มโดยไม่จำเป็น
- ไม่ hardcode business logic นอก knowledge

## Error Handling
- ถ้า Ollama error → return 500
- อย่า swallow error
