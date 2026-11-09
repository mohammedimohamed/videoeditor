import { serve, openPage, PROJECT, PAGE_HELPERS } from './qa-lib.mjs';

const { server, port } = await serve();
const url = `http://127.0.0.1:${port}/compositions/prototype.html`;

const { browser, page } = await openPage(url, { width: 1080, height: 1920 });
await page.evaluate(PAGE_HELPERS);

const armData = await page.evaluate(() => {
  const tl = window.__timelines["prototype"];
  tl.seek(2.8);

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

  return {
    armRot: gsap.getProperty(arm, 'rotation'),
    foreRot: gsap.getProperty(fore, 'rotation'),
    handRot: gsap.getProperty(hand, 'rotation'),
    armPt: pt(arm, 0, 0),
    forePt: pt(fore, 0, 0),
    handPt: pt(hand, 0, 0),
    headPt: pt(head, 0, 0),
  };
});

console.log("Karim Arm at 2.8s:", JSON.stringify(armData, null, 2));

await browser.close();
server.close();
