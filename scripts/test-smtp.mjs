/**
 * Run:  node scripts/test-smtp.mjs
 * Tests SMTP credentials from .env.local directly.
 */
import { createTransport } from 'nodemailer';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env.local');

// Parse .env.local manually
const env = {};
try {
  const lines = readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    env[key] = val;
  }
} catch {
  console.error('❌ Could not read .env.local');
  process.exit(1);
}

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = env;

console.log('\n── SMTP Test ──────────────────────────────────');
console.log('Host :', SMTP_HOST || 'smtp.gmail.com');
console.log('Port :', SMTP_PORT || '587');
console.log('User :', SMTP_USER);
console.log('Pass :', SMTP_PASS ? `${SMTP_PASS.slice(0, 4)}****${SMTP_PASS.slice(-4)} (${SMTP_PASS.length} chars)` : 'NOT SET');
console.log('From :', SMTP_FROM || `"YouTube Clone" <${SMTP_USER}>`);
console.log('───────────────────────────────────────────────\n');

if (!SMTP_USER || !SMTP_PASS) {
  console.error('❌ SMTP_USER or SMTP_PASS is missing from .env.local');
  process.exit(1);
}

const host = SMTP_HOST || 'smtp.gmail.com';
const port = parseInt(SMTP_PORT || '587', 10);

const transporter = createTransport({
  host,
  port,
  secure: port === 465,
  auth: { user: SMTP_USER, pass: SMTP_PASS },
});

console.log('⏳ Verifying SMTP connection…');
try {
  await transporter.verify();
  console.log('✅ SMTP credentials are VALID — server accepted the connection.\n');
} catch (err) {
  console.error('❌ SMTP verification FAILED:');
  console.error('   Code   :', err.code);
  console.error('   Message:', err.message);
  console.error('   Response:', err.response ?? 'none');
  console.error('\n── Troubleshooting ────────────────────────────');
  if (err.code === 'EAUTH' || err.responseCode === 535) {
    console.error('→ Gmail rejected the password.');
    console.error('  1. Make sure 2-Step Verification is ON for pkaran0510@gmail.com');
    console.error('  2. Go to: https://myaccount.google.com/apppasswords');
    console.error('  3. Create a NEW App Password (Mail / Windows Computer)');
    console.error('  4. Copy the 16-char code (no spaces) into SMTP_PASS in .env.local');
    console.error('  5. Do NOT use your regular Gmail password here.');
  } else if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
    console.error('→ Network issue — port', port, 'may be blocked by a firewall.');
    console.error('  Try changing SMTP_PORT to 465 and rerun.');
  }
  console.error('───────────────────────────────────────────────\n');
  process.exit(1);
}
