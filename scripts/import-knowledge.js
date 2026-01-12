const fs = require('fs');
const path = require('path');

// Clean up all incorrect directories first
const knowledgeDir = path.join(process.cwd(), 'app', 'knowledge');
if (fs.existsSync(knowledgeDir)) {
  const items = fs.readdirSync(knowledgeDir, { withFileTypes: true });
  for (const item of items) {
    if (item.isDirectory() && item.name !== 'th' && item.name !== 'en' && item.name !== 'work-permit') {
      fs.rmSync(path.join(knowledgeDir, item.name), { recursive: true, force: true });
    }
  }
}

// Read CSV with proper handling
const csvContent = fs.readFileSync('/Users/sean/Downloads/KnowledgeChunk_rows.csv', 'utf-8');

// Simple CSV parser that handles quoted fields
function parseCSV(content) {
  const lines = [];
  let currentLine = [];
  let currentField = '';
  let inQuotes = false;
  
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentLine.push(currentField);
      currentField = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (currentField || currentLine.length > 0) {
        currentLine.push(currentField);
        lines.push(currentLine);
        currentLine = [];
        currentField = '';
      }
      if (char === '\r' && nextChar === '\n') i++;
    } else {
      currentField += char;
    }
  }
  
  if (currentField || currentLine.length > 0) {
    currentLine.push(currentField);
    lines.push(currentLine);
  }
  
  return lines;
}

const rows = parseCSV(csvContent);
const headers = rows[0];

// Find column indices
const localeIdx = headers.indexOf('locale');
const topicIdx = headers.indexOf('topic');
const contentIdx = headers.indexOf('content');

if (localeIdx === -1 || topicIdx === -1 || contentIdx === -1) {
  console.error('Required columns not found');
  process.exit(1);
}

// Group by locale and topic
const knowledgeMap = {};
for (let i = 1; i < rows.length; i++) {
  const row = rows[i];
  if (row.length <= Math.max(localeIdx, topicIdx, contentIdx)) continue;
  
  const locale = (row[localeIdx] || '').trim();
  const topic = (row[topicIdx] || '').trim();
  const content = (row[contentIdx] || '').trim();
  
  // Validate: locale should be 'th' or 'en', topic should be a valid string
  if (!locale || !topic || !content) continue;
  if (locale !== 'th' && locale !== 'en') continue;
  // Skip invalid topic names
  if (topic.includes('/') || topic.includes('\\') || topic.length > 100) continue;
  // Skip topics that look like numbers or calculations
  if (/^[\d\s\-\+\×\*\/\%\(\)]+$/.test(topic)) continue;
  
  const key = `${locale}/${topic}`;
  if (!knowledgeMap[key]) {
    knowledgeMap[key] = [];
  }
  knowledgeMap[key].push(content);
}

// Write files
for (const [key, contents] of Object.entries(knowledgeMap)) {
  const [locale, topic] = key.split('/');
  const dir = path.join(knowledgeDir, locale);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const filePath = path.join(dir, `${topic}.md`);
  const content = contents.join('\n\n---\n\n');
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`Created: ${filePath}`);
}

console.log(`\nTotal knowledge files created: ${Object.keys(knowledgeMap).length}`);
