import { serve, openPage, PAGE_HELPERS } from './qa-lib.mjs';

const { server, port } = await serve();
const { browser, page } = await openPage(`http://127.0.0.1:${port}/compositions/prototype.html`);
await page.evaluate(PAGE_HELPERS);

// Seek to t = 7.5s (during pointing)
const data = await page.evaluate(() => {
  const tl = window.__timelines["prototype"];
  if (tl) tl.seek(7.5);

  const q = (sel) => document.querySelector(sel);
  const pt = (el, x = 0, y = 0) => {
    if (!el) return null;
    const m = el.getCTM();
    return { x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f };
  };

  const armL = q('#proto-mohamed .joint-arm-l');
  const forearmL = q('#proto-mohamed .joint-forearm-l');
  const handL = q('#proto-mohamed .joint-hand-l');
  const markerTip = q('#proto-mohamed .marker-tip');
  const markerPalm = q('#proto-mohamed .marker-palm');
  const laptop = q('#office-desk') || q('#env-layer');

  return {
    shoulder: pt(armL, 0, 0),
    elbow: pt(forearmL, 0, 0),
    wrist: pt(handL, 0, 0),
    tip: markerTip ? pt(markerTip, 0, 0) : null,
    palm: markerPalm ? pt(markerPalm, 0, 0) : null,
  };
});

console.log("Measured DOM geometry at 7.5s:", JSON.stringify(data, null, 2));

await browser.close();
server.close();
