import fs from 'node:fs';
import path from 'node:path';
import { serve, openPage, PROJECT, PAGE_HELPERS } from './qa-lib.mjs';

const { server, port } = await serve();
const url = `http://127.0.0.1:${port}/compositions/prototype.html`;
console.log(`Loading ${url}...`);

const { browser, page } = await openPage(url, { width: 1080, height: 1920 });
await page.evaluate(PAGE_HELPERS);
await new Promise(r => setTimeout(r, 2000));

// Directory for frame captures
const outDir = path.join(PROJECT, 'exports', 'previews');
fs.mkdirSync(outDir, { recursive: true });
const brainDir = 'C:\\Users\\m.mohammedi\\.gemini\\antigravity\\brain\\c67455ef-bd48-4f17-a254-b96aa958fbf7';

// 1. Measure Walk Cycle Stance Foot Stability between 2.4s and 5.2s
console.log("\n--- MEASURING WALK CYCLE STANCE PHASE FOOT STABILITY ---");
const walkMeasurements = await page.evaluate(() => {
  const tl = window.__timelines?.["main"] || window.__timelines?.["prototype"];
  const pt = (el, x = 0, y = 0) => {
    if (!el) return null;
    const m = el.getCTM();
    return { x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f };
  };

  const q = (sel) => document.querySelector(sel);
  const footL = q('#proto-mohamed .joint-foot-l');
  const footR = q('#proto-mohamed .joint-foot-r');
  const heelL = q('#proto-mohamed .joint-foot-l .marker-heel');
  const heelR = q('#proto-mohamed .joint-foot-r .marker-heel');
  const toeL = q('#proto-mohamed .joint-foot-l .marker-toe');
  const toeR = q('#proto-mohamed .joint-foot-r .marker-toe');
  const root = q('#proto-mohamed .character-root');

  const times = [2.4, 2.7, 3.0, 3.3, 3.6, 3.9, 4.2, 4.5, 4.8, 5.2];
  const samples = [];

  for (const t of times) {
    if (tl) tl.seek(t);
    samples.push({
      t,
      rootX: root ? pt(root, 0, 0).x : null,
      nearHeel: heelL ? pt(heelL, 0, 0) : null,
      nearToe: toeL ? pt(toeL, 0, 0) : null,
      farHeel: heelR ? pt(heelR, 0, 0) : null,
      farToe: toeR ? pt(toeR, 0, 0) : null,
    });
  }
  return samples;
});

console.log("Walk cycle samples:", JSON.stringify(walkMeasurements, null, 2));

// 2. Measure Pointing Gesture IK Geometry at 7.5s
console.log("\n--- MEASURING POINTING GESTURE IK GEOMETRY AT 7.5s ---");
const ikData = await page.evaluate(() => {
  const tl = window.__timelines?.["main"] || window.__timelines?.["prototype"];
  if (tl) tl.seek(7.5);

  const q = (sel) => document.querySelector(sel);
  const pt = (el, x = 0, y = 0) => {
    if (!el) return null;
    const m = el.getCTM();
    return { x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f };
  };

  const dist = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);
  const ang = (a, b) => Math.atan2(b.y - a.y, b.x - a.x) * (180 / Math.PI);

  const armL = q('#proto-mohamed .joint-arm-l');
  const forearmL = q('#proto-mohamed .joint-forearm-l');
  const handL = q('#proto-mohamed .joint-hand-l');
  const markerTip = q('#proto-mohamed .joint-arm-l .marker-tip');
  const markerPalm = q('#proto-mohamed .joint-arm-l .marker-palm');
  const desk = q('#office-desk');
  const laptopScreen = q('#laptop-screen') || q('#laptop-scrolling-rows');

  const S = pt(armL, 0, 0);
  const E = pt(forearmL, 0, 0);
  const W = pt(handL, 0, 0);
  const Tip = markerTip ? pt(markerTip, 0, 0) : pt(handL, 0, 50);

  // Screen spreadsheet target
  const Target = { x: 525, y: 985 };

  const L1 = dist(S, E);
  const L2 = dist(E, Tip);
  const reachDist = dist(S, Tip);
  const targetDist = dist(S, Target);
  const tipToTarget = dist(Tip, Target);

  // Joint angles
  const upperArmAng = ang(S, E);
  const forearmAng = ang(E, Tip);
  const elbowFlexion = forearmAng - upperArmAng;

  return {
    shoulder: S,
    elbow: E,
    wrist: W,
    fingertip: Tip,
    target: Target,
    L1,
    L2,
    reachDist,
    targetDist,
    tipToTarget,
    upperArmAng,
    forearmAng,
    elbowFlexion,
  };
});

console.log("Measured IK DOM Geometry:", JSON.stringify(ikData, null, 2));

// 3. Capture Consecutive Walk Frames (2.4s to 5.2s)
console.log("\n--- CAPTURING CONSECUTIVE WALK FRAMES (2.4s to 5.2s) ---");
const walkFrames = [2.4, 2.8, 3.2, 3.6, 4.0, 4.4, 4.8, 5.2];
const walkPaths = [];

for (const t of walkFrames) {
  await page.evaluate((seekT) => {
    const tl = window.__timelines?.["main"] || window.__timelines?.["prototype"];
    if (tl) tl.seek(seekT);
  }, t);

  const frameFilename = `walk-frame-at-${t}s.png`;
  const framePath = path.join(outDir, frameFilename);
  await page.screenshot({ path: framePath, type: 'png' });
  walkPaths.push(framePath);

  if (fs.existsSync(brainDir)) {
    fs.copyFileSync(framePath, path.join(brainDir, frameFilename));
  }
}
console.log(`Captured ${walkPaths.length} walk frames.`);

// 4. Capture Key Story Beat Snapshots (0.8s, 1.8s, 2.8s, 5.4s, 7.2s, 8.4s)
console.log("\n--- CAPTURING STORY BEAT SNAPSHOTS ---");
const storyBeats = [
  { t: 0.8, name: 'frame-01-at-0.8s-karim-typing.png' },
  { t: 1.8, name: 'frame-02-at-1.8s-karim-worry.png' },
  { t: 2.8, name: 'frame-03-at-2.8s-karim-hand-to-temple.png' },
  { t: 4.0, name: 'frame-04-at-4.0s-mohamed-walking.png' },
  { t: 5.4, name: 'frame-05-at-5.4s-mohamed-greet-karim-reacts.png' },
  { t: 7.5, name: 'frame-06-at-7.5s-mohamed-points-karim-follows.png' },
  { t: 8.5, name: 'frame-07-at-8.5s-solution-pivot-table.png' }
];

for (const beat of storyBeats) {
  await page.evaluate((seekT) => {
    const tl = window.__timelines?.["main"] || window.__timelines?.["prototype"];
    if (tl) tl.seek(seekT);
  }, beat.t);

  const framePath = path.join(outDir, beat.name);
  await page.screenshot({ path: framePath, type: 'png' });
  if (fs.existsSync(brainDir)) {
    fs.copyFileSync(framePath, path.join(brainDir, beat.name));
  }
}
console.log(`Captured ${storyBeats.length} story beat snapshots.`);

await browser.close();
server.close();

// Write results to JSON file for report inclusion
fs.writeFileSync(path.join(PROJECT, 'exports', 'qa-measurements.json'), JSON.stringify({
  walkMeasurements,
  ikData
}, null, 2));

console.log("QA Measurement Complete! Results saved to exports/qa-measurements.json");
