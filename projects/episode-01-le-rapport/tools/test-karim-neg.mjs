import { serve, openPage, PROJECT, PAGE_HELPERS } from './qa-lib.mjs';

const { server, port } = await serve();
const url = `http://127.0.0.1:${port}/compositions/prototype.html`;

const { browser, page } = await openPage(url, { width: 1080, height: 1920 });
await page.evaluate(PAGE_HELPERS);

const results = await page.evaluate(() => {
  const q = (sel) => document.querySelector(sel);
  const pt = (el, x = 0, y = 0) => {
    if (!el) return null;
    const m = el.getCTM();
    return { x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f };
  };

  const arm = q('#proto-employee .joint-arm-r');
  const fore = q('#proto-employee .joint-forearm-r');
  const hand = q('#proto-employee .joint-hand-r');
  const head = q('#proto-employee .joint-head');
  const temple = pt(q('#proto-employee .part-face'), 35, -50);

  const testAngles = [
    { arm: 20, fore: -130 },
    { arm: 30, fore: -140 },
    { arm: 40, fore: -150 },
    { arm: -20, fore: -110 },
    { arm: 10, fore: -120 },
  ];

  return testAngles.map(({ arm: a, fore: f }) => {
    gsap.set(arm, { rotation: a });
    gsap.set(fore, { rotation: f });
    gsap.set(hand, { rotation: 0 });

    const S = pt(arm, 0, 0);
    const E = pt(fore, 0, 0);
    const H = pt(hand, 0, 0);

    return {
      arm: a,
      fore: f,
      S, E, H,
      temple,
      distHandToTemple: Math.hypot(H.x - temple.x, H.y - temple.y)
    };
  });
});

console.log("Karim Negative Forearm Search:", JSON.stringify(results, null, 2));

await browser.close();
server.close();
