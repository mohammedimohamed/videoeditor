/**
 * QA harness: serves the project over HTTP, opens it in the same headless Chrome HyperFrames uses,
 * seeks the real timeline and measures real rendered DOM geometry (no analytical shortcuts).
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const here = path.dirname(fileURLToPath(import.meta.url));
export const PROJECT = path.resolve(here, '..');
const require = createRequire(path.resolve(PROJECT, '../../package.json'));
const puppeteer = require('puppeteer-core');

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg' };

export function findChrome() {
  const base = path.join(os.homedir(), '.cache', 'hyperframes', 'chrome', 'chrome-headless-shell');
  for (const v of fs.readdirSync(base)) {
    const p = path.join(base, v, 'chrome-headless-shell-win64', 'chrome-headless-shell.exe');
    if (fs.existsSync(p)) return p;
  }
  throw new Error('chrome-headless-shell not found');
}

export function serve(root = PROJECT) {
  const server = http.createServer((req, res) => {
    const u = decodeURIComponent(req.url.split('?')[0]);
    const f = path.join(root, u === '/' ? 'index.html' : u);
    if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end('nf'); return; }
    res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise((r) => server.listen(0, '127.0.0.1', () => r({ server, port: server.address().port })));
}

export async function openPage(url, { width = 1080, height = 1920 } = {}) {
  const browser = await puppeteer.launch({ executablePath: findChrome(), headless: 'shell', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader'] });
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => console.error('[pageerror]', e.message));
  page.on('console', (m) => { if (m.type() === 'error') console.error('[console.error]', m.text()); });
  await page.goto(url, { waitUntil: 'load', timeout: 30000 });
  return { browser, page };
}

/** Page-side helpers injected once. All geometry is read from the live DOM (getCTM). */
export const PAGE_HELPERS = `
window.__qa = {
  pt(el, x, y) { const m = el.getCTM(); return { x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f }; },
  q(svgSel, cls) { return document.querySelector(svgSel + ' ' + cls); },
};`;
