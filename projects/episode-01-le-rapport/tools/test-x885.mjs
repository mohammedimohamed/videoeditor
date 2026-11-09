import path from 'node:path';
import { serve, openPage, PROJECT, PAGE_HELPERS } from './qa-lib.mjs';

const { server, port } = await serve();
const url = `http://127.0.0.1:${port}/compositions/prototype.html`;

const { browser, page } = await openPage(url, { width: 1080, height: 1920 });
await page.evaluate(PAGE_HELPERS);

await page.evaluate(() => {
  const tl = window.__timelines["prototype"];
  tl.seek(7.5);

  const q = (sel) => document.querySelector(sel);
  const root = q('#proto-mohamed .character-root');
  const arm = q('#proto-mohamed .joint-arm-l');
  const fore = q('#proto-mohamed .joint-forearm-l');

  // Place Mohamed at x=885, arm elevated with natural bend
  gsap.set(root, { x: 885 });
  gsap.set(arm, { rotation: 46 });
  gsap.set(fore, { rotation: 30 });
});

const outPath = path.join(PROJECT, 'exports', 'previews', 'test-pointing-x885.png');
await page.screenshot({ path: outPath, type: 'png' });
console.log(`Saved screenshot to ${outPath}`);

await browser.close();
server.close();
