import { serve, openPage, PROJECT, PAGE_HELPERS } from './qa-lib.mjs';

const { server, port } = await serve();
const url = `http://127.0.0.1:${port}/compositions/prototype.html`;

const { browser, page } = await openPage(url, { width: 1080, height: 1920 });
await page.evaluate(PAGE_HELPERS);

const best = await page.evaluate(() => {
  const tl = window.__timelines["prototype"];
  tl.seek(7.5);

  const q = (sel) => document.querySelector(sel);
  const pt = (el, x = 0, y = 0) => {
    if (!el) return null;
    const m = el.getCTM();
    return { x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f };
  };

  const arm = q('#proto-mohamed .joint-arm-l');
  const fore = q('#proto-mohamed .joint-forearm-l');
  const hand = q('#proto-mohamed .joint-hand-l');
  const tip = q('#proto-mohamed .joint-hand-l .marker-tip') || hand;

  const Target = { x: 650, y: 1035 };

  let bestMatch = null;
  let minD = 9999;

  for (let a = 30; a <= 80; a += 1) {
    for (let f = -50; f <= 10; f += 1) {
      gsap.set(arm, { rotation: a });
      gsap.set(fore, { rotation: f });
      gsap.set(hand, { rotation: 0 });

      const T = pt(tip, 0, 0);
      const d = Math.hypot(T.x - Target.x, T.y - Target.y);
      if (d < minD) {
        minD = d;
        bestMatch = { arm: a, fore: f, dist: d, T, S: pt(arm, 0, 0), E: pt(fore, 0, 0), Target };
      }
    }
  }
  return bestMatch;
});

console.log("BEST Mohamed Pointing with Negative Forearm:", JSON.stringify(best, null, 2));

await browser.close();
server.close();
