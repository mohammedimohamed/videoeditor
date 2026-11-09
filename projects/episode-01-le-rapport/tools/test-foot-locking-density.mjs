import { serve, openPage } from './qa-lib.mjs';

async function test() {
  const { server, port } = await serve();
  const { browser, page } = await openPage(`http://127.0.0.1:${port}/compositions/test-suite.html`);

  console.log('Testing foot-locking frame by frame at 30 FPS...');

  // In test-suite.html:
  // t = 9.5s to 11.5s is Walk Right (820 -> 1020)
  // Let's sample 60 frames from t = 9.5 to 11.5 at step 1/30s
  const fps = 30;
  const dt = 1 / fps;
  const samplesRight = [];

  for (let k = 0; k <= 60; k++) {
    const t = 9.5 + k * dt;
    await page.evaluate((seekT) => {
      window.__timelines['test-suite'].seek(seekT);
    }, t);
    const m = await page.evaluate(() => {
      const q = (sel) => document.querySelector(sel);
      const pt = (el) => {
        if (!el) return { x: 0, y: 0 };
        const ctm = el.getCTM();
        return { x: ctm.e, y: ctm.f };
      };
      const root = pt(q('#test-mohamed .character-root'));
      const nearHeel = pt(q('#test-mohamed .joint-foot-l .marker-heel'));
      const farHeel = pt(q('#test-mohamed .joint-foot-r .marker-heel'));
      const nearToe = pt(q('#test-mohamed .joint-foot-l .marker-toe'));
      const farToe = pt(q('#test-mohamed .joint-foot-r .marker-toe'));
      return { root, nearHeel, farHeel, nearToe, farToe };
    });
    samplesRight.push({ frame: k, t: Number(t.toFixed(4)), ...m });
  }

  console.log(`Recorded ${samplesRight.length} frames for Walk Right.`);

  // Step 0 in Walk Right is from t = 9.5 to 9.5 + 2.0/3 = 10.167s
  // Stance leg in step 0 is far foot (legR)
  const step0Frames = samplesRight.filter(s => s.t >= 9.5 && s.t <= 10.16);
  const anchorX = step0Frames[0].farHeel.x;
  console.log(`Step 0 Anchor X: ${anchorX.toFixed(2)} at t=${step0Frames[0].t}`);

  let maxDrift = 0;
  let maxFloorDev = 0;
  for (const s of step0Frames) {
    const drift = Math.abs(s.farHeel.x - anchorX);
    const floorDev = Math.abs(s.farHeel.y - 1386.0);
    if (drift > maxDrift) maxDrift = drift;
    if (floorDev > maxFloorDev) maxFloorDev = floorDev;
  }
  console.log(`Step 0 (Far Foot) Max Drift: ${maxDrift.toFixed(3)}px, Max Floor Dev: ${maxFloorDev.toFixed(3)}px across ${step0Frames.length} frames`);

  await browser.close();
  server.close();
}

test().catch(console.error);
