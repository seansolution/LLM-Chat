# Project: Mistral Mini Chatbot

## Goal
สร้าง Web Chatbot แบบง่าย
- ใช้ Mistral ผ่าน Ollama
- ข้อมูลมาจากไฟล์ Markdown
- ไม่ใช้ training / fine-tuning

## Target Users
- ลูกค้าทั่วไป (customer-facing)

## Supported Channels
- Web Chat (REST API)

## AI Behavior
- ตอบเฉพาะข้อมูลที่อยู่ใน knowledge
- ถ้าไม่มีข้อมูล → แนะนำติดต่อเจ้าหน้าที่
- ใช้ภาษาสุภาพ ภาษาไทย

## Non-Goals
- ไม่ทำ AI agent
- ไม่เรียก API ภายนอก
- ไม่เก็บข้อมูลส่วนบุคคล
