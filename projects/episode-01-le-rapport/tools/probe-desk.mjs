import { serve, openPage, PROJECT, PAGE_HELPERS } from './qa-lib.mjs';

const { server, port } = await serve();
const url = `http://127.0.0.1:${port}/compositions/prototype.html`;

const { browser, page } = await openPage(url, { width: 1080, height: 1920 });
await page.evaluate(PAGE_HELPERS);

const positions = await page.evaluate(() => {
  const q = (sel) => document.querySelector(sel);
  const bbox = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom };
  };

  const desk = q('#office-desk');
  const laptopScreen = q('#laptop-screen') || q('#laptop-scrolling-rows') || q('rect[fill="#FFFFFF"]');
  const deskLayer = q('#desk-layer');
  const mohamed = q('#proto-mohamed .character-root');
  const employee = q('#proto-employee .character-root');

  return {
    desk: bbox(desk),
    laptopScreen: bbox(laptopScreen),
    deskLayer: bbox(deskLayer),
    mohamed: bbox(mohamed),
    employee: bbox(employee)
  };
});

console.log("Stage Positions:", JSON.stringify(positions, null, 2));

await browser.close();
server.close();
