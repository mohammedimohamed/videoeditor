import { serve, openPage, PROJECT, PAGE_HELPERS } from './qa-lib.mjs';

const { server, port } = await serve();
const url = `http://127.0.0.1:${port}/compositions/prototype.html`;

const { browser, page } = await openPage(url, { width: 1080, height: 1920 });
await page.evaluate(PAGE_HELPERS);

const best = await page.evaluate(() => {
  const q = (sel) => document.querySelector(sel);
  const pt = (el, x = 0, y = 0) => {
    if (!el) return null;
    const m = el.getCTM();
    return { x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f };
  };

  const arm = q('#proto-employee .joint-arm-r');
  const fore = q('#proto-employee .joint-forearm-r');
  const hand = q('#proto-employee .joint-hand-r');
  const temple = pt(q('#proto-employee .part-face'), 40, -50);

  let bestMatch = null;
  let minD = 9999;

  for (let a = -70; a <= 20; a += 5) {
    for (let f = -220; f <= 220; f += 5) {
      gsap.set(arm, { rotation: a });
      gsap.set(fore, { rotation: f });
      gsap.set(hand, { rotation: 0 });

      const H = pt(hand, 0, 0);
      const d = Math.hypot(H.x - temple.x, H.y - temple.y);
      if (d < minD) {
        minD = d;
        bestMatch = { arm: a, fore: f, dist: d, H, temple, S: pt(arm, 0, 0), E: pt(fore, 0, 0) };
      }
    }
  }
  return bestMatch;
});

console.log("BEST Karim Forehead Contact Pose:", JSON.stringify(best, null, 2));

await browser.close();
server.close();
