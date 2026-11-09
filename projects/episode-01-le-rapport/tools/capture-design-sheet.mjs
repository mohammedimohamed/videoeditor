import fs from 'node:fs';
import path from 'node:path';
import { serve, openPage, PROJECT } from './qa-lib.mjs';

const { server, port } = await serve();
const url = `http://127.0.0.1:${port}/compositions/character-design-sheet.html`;
console.log(`Opening ${url}...`);

const { browser, page } = await openPage(url, { width: 1080, height: 1920 });
await new Promise(r => setTimeout(r, 2000));

const outDir = path.join(PROJECT, 'exports', 'previews');
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'character-design-sheet.png');

await page.screenshot({ path: outPath, type: 'png' });
console.log(`Saved screenshot to ${outPath}`);

// Also copy to brain artifact dir
const brainDir = 'C:\\Users\\m.mohammedi\\.gemini\\antigravity\\brain\\c67455ef-bd48-4f17-a254-b96aa958fbf7';
if (fs.existsSync(brainDir)) {
  const brainPath = path.join(brainDir, 'character-design-sheet.png');
  fs.copyFileSync(outPath, brainPath);
  console.log(`Copied to brain: ${brainPath}`);
}

await browser.close();
server.close();
