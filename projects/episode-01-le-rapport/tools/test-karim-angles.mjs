import { serve, openPage, PROJECT, PAGE_HELPERS } from './qa-lib.mjs';

const { server, port } = await serve();
const url = `http://127.0.0.1:${port}/compositions/prototype.html`;

const { browser, page } = await openPage(url, { width: 1080, height: 1920 });
await page.evaluate(PAGE_HELPERS);

// Test different armR and forearmR angles in the live DOM
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
  const tip = q('#proto-employee .joint-hand-r .marker-tip') || hand;
  const head = q('#proto-employee .joint-head');

  const testAngles = [
    { arm: -60, fore: 120 },
    { arm: -55, fore: 130 },
    { arm: -50, fore: 140 },
    { arm: -45, fore: 145 },
    { arm: -40, fore: 150 },
    { arm: -35, fore: 155 },
    { arm: -70, fore: 110 },
  ];

  const headPos = pt(head, 0, 0); // approx center of face

  return testAngles.map(({ arm: a, fore: f }) => {
    gsap.set(arm, { rotation: a });
    gsap.set(fore, { rotation: f });
    gsap.set(hand, { rotation: 10 });

    const S = pt(arm, 0, 0);
    const E = pt(fore, 0, 0);
    const H = pt(hand, 0, 0);
    const T = pt(tip, 0, 0);

    return {
      arm: a,
      fore: f,
      shoulder: S,
      elbow: E,
      hand: H,
      tip: T,
      distHandToHead: Math.hypot(H.x - (headPos.x + 35), H.y - (headPos.y - 20)),
      elbowY: E.y,
      shoulderY: S.y,
    };
  });
});

console.log("Karim Arm Angle Search:", JSON.stringify(results, null, 2));

await browser.close();
server.close();
