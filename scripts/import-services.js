const fs = require('fs');
const path = require('path');

// Read CSV with proper handling
const csvContent = fs.readFileSync('/Users/sean/Downloads/Service_rows.csv', 'utf-8');

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
const categoryIdx = headers.indexOf('category');
const nameThIdx = headers.indexOf('name_th');
const descriptionThIdx = headers.indexOf('description_th');
const priceIdx = headers.indexOf('price');
const currencyIdx = headers.indexOf('currency');
const typeIdx = headers.indexOf('type');
const isActiveIdx = headers.indexOf('is_active');

if (categoryIdx === -1 || nameThIdx === -1 || descriptionThIdx === -1) {
  console.error('Required columns not found');
  process.exit(1);
}

// Group by category
const servicesByCategory = {};

for (let i = 1; i < rows.length; i++) {
  const row = rows[i];
  if (row.length <= Math.max(categoryIdx, nameThIdx, descriptionThIdx)) continue;
  
  const isActive = row[isActiveIdx] === 'true';
  if (!isActive) continue;
  
  const category = (row[categoryIdx] || '').trim();
  const nameTh = (row[nameThIdx] || '').trim();
  const descriptionTh = (row[descriptionThIdx] || '').trim();
  const price = (row[priceIdx] || '').trim();
  const currency = (row[currencyIdx] || '').trim();
  const type = (row[typeIdx] || '').trim();
  
  if (!category || !nameTh || !descriptionTh) continue;
  
  if (!servicesByCategory[category]) {
    servicesByCategory[category] = [];
  }
  
  servicesByCategory[category].push({
    name: nameTh,
    description: descriptionTh,
    price,
    currency,
    type
  });
}

// Generate markdown content
let markdown = '# บริการของบริษัท\n\n';
markdown += 'รายการบริการทั้งหมดที่บริษัทให้บริการ\n\n';

for (const [category, services] of Object.entries(servicesByCategory)) {
  const categoryName = {
    'hr': 'บริการ HR (ทรัพยากรบุคคล)',
    'payroll': 'บริการเงินเดือน',
    'accounting': 'บริการบัญชี',
    'registration': 'บริการจดทะเบียน',
    'licenses': 'บริการใบอนุญาต',
    'labor-law': 'บริการกฎหมายแรงงาน'
  }[category] || category;
  
  markdown += `## ${categoryName}\n\n`;
  
  for (const service of services) {
    markdown += `### ${service.name}\n\n`;
    markdown += `${service.description}\n\n`;
    if (service.price && service.currency) {
      const priceText = service.type === 'monthly' 
        ? `${parseFloat(service.price).toLocaleString('th-TH')} ${service.currency}/เดือน`
        : `${parseFloat(service.price).toLocaleString('th-TH')} ${service.currency} (ครั้งเดียว)`;
      markdown += `**ราคา:** ${priceText}\n\n`;
    }
    markdown += '---\n\n';
  }
}

// Write to file
const knowledgeDir = path.join(process.cwd(), 'app', 'knowledge');
if (!fs.existsSync(knowledgeDir)) {
  fs.mkdirSync(knowledgeDir, { recursive: true });
}

const filePath = path.join(knowledgeDir, 'services.md');
fs.writeFileSync(filePath, markdown, 'utf-8');
console.log(`Created: ${filePath}`);
console.log(`Total services: ${Object.values(servicesByCategory).reduce((sum, arr) => sum + arr.length, 0)}`);
