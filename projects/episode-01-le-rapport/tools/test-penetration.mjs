import { serve, openPage, PROJECT, PAGE_HELPERS } from './qa-lib.mjs';

const { server, port } = await serve();
const url = `http://127.0.0.1:${port}/compositions/prototype.html`;

const { browser, page } = await openPage(url, { width: 1080, height: 1920 });
await page.evaluate(PAGE_HELPERS);

const testConfigs = [
  { rootX: 830, arm: 42, fore: 38 },
  { rootX: 840, arm: 44, fore: 34 },
  { rootX: 850, arm: 46, fore: 30 },
  { rootX: 860, arm: 48, fore: 26 },
  { rootX: 870, arm: 50, fore: 24 },
];

const results = await page.evaluate((configs) => {
  const tl = window.__timelines["prototype"];
  tl.seek(7.5);

  const q = (sel) => document.querySelector(sel);
  const pt = (el, x = 0, y = 0) => {
    if (!el) return null;
    const m = el.getCTM();
    return { x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f };
  };

  const root = q('#proto-mohamed .character-root');
  const arm = q('#proto-mohamed .joint-arm-l');
  const fore = q('#proto-mohamed .joint-forearm-l');
  const tip = q('#proto-mohamed .joint-arm-l .marker-tip');

  const laptopBezelX = 618;
  const laptopTopY = 965;
  const laptopBottomY = 1075;

  return configs.map(({ rootX, arm: a, fore: f }) => {
    gsap.set(root, { x: rootX });
    gsap.set(arm, { rotation: a });
    gsap.set(fore, { rotation: f });

    const S = pt(arm, 0, 0);
    const E = pt(fore, 0, 0);
    const T = pt(tip, 0, 0);

    const clearanceX = T.x - laptopBezelX;

    return {
      rootX,
      arm: a,
      fore: f,
      S, E, T,
      clearanceX,
      penetrates: T.x < laptopBezelX && T.y > laptopTopY && T.y < laptopBottomY
    };
  });
}, testConfigs);

console.log("Mohamed Penetration Test Results:", JSON.stringify(results, null, 2));

await browser.close();
server.close();
