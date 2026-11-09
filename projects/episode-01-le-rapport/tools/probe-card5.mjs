import { serve, openPage, PROJECT, PAGE_HELPERS } from './qa-lib.mjs';

const { server, port } = await serve();
const url = `http://127.0.0.1:${port}/compositions/character-design-sheet.html`;

const { browser, page } = await openPage(url, { width: 1080, height: 1920 });
await page.evaluate(PAGE_HELPERS);

const card5Data = await page.evaluate(() => {
  const q = (sel) => document.querySelector(sel);
  const pt = (el, x = 0, y = 0) => {
    if (!el) return null;
    const m = el.getCTM();
    return { x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f };
  };
  const dist = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);
  const ang = (a, b) => Math.atan2(b.y - a.y, b.x - a.x) * (180 / Math.PI);

  const arm = q('#card-mohamed-pointing .joint-arm-l');
  const fore = q('#card-mohamed-pointing .joint-forearm-l');
  const hand = q('#card-mohamed-pointing .joint-hand-l');
  const tip = q('#card-mohamed-pointing .marker-tip');

  const S = pt(arm, 0, 0);
  const E = pt(fore, 0, 0);
  const W = pt(hand, 0, 0);
  const T = tip ? pt(tip, 0, 0) : null;

  return {
    S, E, W, T,
    L1: dist(S, E),
    L2: dist(E, T),
    reach: dist(S, T),
    angSE: ang(S, E),
    angET: ang(E, T),
    flexion: ang(E, T) - ang(S, E)
  };
});

console.log("Card 5 Geometry:", JSON.stringify(card5Data, null, 2));

await browser.close();
server.close();
