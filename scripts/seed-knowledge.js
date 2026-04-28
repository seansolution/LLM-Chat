#!/usr/bin/env node
/**
 * seed-knowledge.js
 * Uploads all markdown files from app/knowledge/ into the RAG backend
 * via POST /documents so they go through the full parse → embed pipeline.
 *
 * Usage:
 *   node scripts/seed-knowledge.js
 *   BACKEND_URL=http://localhost:8001 node scripts/seed-knowledge.js
 *   node scripts/seed-knowledge.js --dry-run   (just list files, no upload)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8001';
const DRY_RUN = process.argv.includes('--dry-run');
const DELAY_MS = 300; // small delay between uploads to avoid overwhelming NATS

// ── helpers ──────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Collect all .md files recursively under a directory.
 * Returns [{ filePath, language }]
 */
function collectMarkdownFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;

  function walk(current) {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        // Infer language from parent folder name (th / en / etc.)
        const rel = path.relative(dir, full);
        const parts = rel.split(path.sep);
        const lang = parts.length > 1 ? parts[0] : 'th'; // default th
        results.push({ filePath: full, language: lang, relativePath: rel });
      }
    }
  }

  walk(dir);
  return results;
}

/**
 * Multipart form-data upload using only Node built-ins (no fetch/axios needed).
 */
function uploadFile({ filePath, language }) {
  return new Promise((resolve, reject) => {
    const fileContent = fs.readFileSync(filePath);
    const filename = path.basename(filePath);
    const boundary = `----FormBoundary${Date.now().toString(16)}`;

    // Build multipart body
    const parts = [];
    // file field
    parts.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: text/markdown\r\n\r\n`
      )
    );
    parts.push(fileContent);
    parts.push(Buffer.from('\r\n'));
    // language field
    parts.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="language"\r\n\r\n${language}\r\n`
      )
    );
    parts.push(Buffer.from(`--${boundary}--\r\n`));

    const body = Buffer.concat(parts);

    const url = new URL(`${BACKEND_URL}/documents`);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length,
      },
    };

    const lib = url.protocol === 'https:' ? https : http;
    const req = lib.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        if (res.statusCode === 202) {
          resolve(JSON.parse(data));
        } else if (res.statusCode === 409) {
          resolve({ skipped: true, reason: 'duplicate' });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
  const knowledgeDir = path.join(process.cwd(), 'app', 'knowledge');
  const files = collectMarkdownFiles(knowledgeDir);

  if (files.length === 0) {
    console.log('No markdown files found in app/knowledge/');
    return;
  }

  console.log(`Found ${files.length} knowledge files`);
  if (DRY_RUN) {
    files.forEach((f) => console.log(`  [${f.language}] ${f.relativePath}`));
    return;
  }

  console.log(`Uploading to ${BACKEND_URL}/documents ...\n`);

  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const file of files) {
    process.stdout.write(`  → ${file.relativePath} (lang=${file.language}) ... `);
    try {
      const result = await uploadFile(file);
      if (result.skipped) {
        console.log('skipped (duplicate)');
        skipped++;
      } else {
        console.log(`ok  [doc_id=${result.document_id}]`);
        uploaded++;
      }
    } catch (err) {
      console.log(`FAILED: ${err.message}`);
      failed++;
    }
    await sleep(DELAY_MS);
  }

  console.log(`\nDone. uploaded=${uploaded}  skipped=${skipped}  failed=${failed}`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
