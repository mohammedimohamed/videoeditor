import { serve, openPage } from './qa-lib.mjs';

async function test() {
  const { server, port } = await serve();
  const { browser, page } = await openPage(`http://127.0.0.1:${port}/compositions/test-suite.html`);
  const fps = 30;
  const dt = 1 / fps;

  console.log('--- 1. Testing Walk Right (B2a: 7.8s to 9.8s, 60 frames) ---');
  const rightFrames = [];
  for (let k = 0; k <= 60; k++) {
    const t = 7.8 + k * dt;
    await page.evaluate((seekT) => {
      window.__timelines['test-suite'].seek(seekT);
    }, t);
    const m = await page.evaluate(() => {
      const q = (s) => document.querySelector(s);
      const pt = (el) => {
        const ctm = el.getCTM();
        return { x: ctm.e, y: ctm.f };
      };
      const root = pt(q('#test-mohamed .character-root'));
      const nearHeel = pt(q('#test-mohamed .joint-foot-l .marker-heel'));
      const farHeel = pt(q('#test-mohamed .joint-foot-r .marker-heel'));
      return { root, nearHeel, farHeel };
    });
    rightFrames.push({ k, t: Number(t.toFixed(4)), ...m });
  }

  // In Walk Right: Step 0 stance leg is far heel (t=7.8 to 8.3)
  const rightStep0 = rightFrames.filter(f => f.t >= 7.8 && f.t <= 8.3);
  const rightAnchorX = rightStep0[0].farHeel.x;
  let rightMaxDrift = 0;
  let rightMaxFloorDev = 0;
  for (const f of rightStep0) {
    const drift = Math.abs(f.farHeel.x - rightAnchorX);
    const floorDev = Math.abs(f.farHeel.y - 1386.0);
    if (drift > rightMaxDrift) rightMaxDrift = drift;
    if (floorDev > rightMaxFloorDev) rightMaxFloorDev = floorDev;
  }
  console.log(`Walk Right: Step 0 AnchorX=${rightAnchorX.toFixed(2)}, MaxDrift=${rightMaxDrift.toFixed(3)}px, MaxFloorDev=${rightMaxFloorDev.toFixed(3)}px (${rightStep0.length} frames)`);

  console.log('\n--- 2. Testing Walk Left (B2b: 10.0s to 11.8s, 54 frames) ---');
  const leftFrames = [];
  for (let k = 0; k <= 54; k++) {
    const t = 10.0 + k * dt;
    await page.evaluate((seekT) => {
      window.__timelines['test-suite'].seek(seekT);
    }, t);
    const m = await page.evaluate(() => {
      const q = (s) => document.querySelector(s);
      const pt = (el) => {
        const ctm = el.getCTM();
        return { x: ctm.e, y: ctm.f };
      };
      const root = pt(q('#test-mohamed .character-root'));
      const nearHeel = pt(q('#test-mohamed .joint-foot-l .marker-heel'));
      const farHeel = pt(q('#test-mohamed .joint-foot-r .marker-heel'));
      return { root, nearHeel, farHeel };
    });
    leftFrames.push({ k, t: Number(t.toFixed(4)), ...m });
  }

  // In Walk Left: Step 0 stance leg is far heel (t=10.0 to 10.6)
  const leftStep0 = leftFrames.filter(f => f.t >= 10.0 && f.t <= 10.6);
  const leftAnchorX = leftStep0[0].farHeel.x;
  let leftMaxDrift = 0;
  let leftMaxFloorDev = 0;
  for (const f of leftStep0) {
    const drift = Math.abs(f.farHeel.x - leftAnchorX);
    const floorDev = Math.abs(f.farHeel.y - 1386.0);
    if (drift > leftMaxDrift) leftMaxDrift = drift;
    if (floorDev > leftMaxFloorDev) leftMaxFloorDev = floorDev;
  }
  console.log(`Walk Left: Step 0 AnchorX=${leftAnchorX.toFixed(2)}, MaxDrift=${leftMaxDrift.toFixed(3)}px, MaxFloorDev=${leftMaxFloorDev.toFixed(3)}px (${leftStep0.length} frames)`);

  await browser.close();
  server.close();
}

test().catch(console.error);
