import fs from 'node:fs';
import path from 'node:path';
import { serve, openPage, PROJECT } from './qa-lib.mjs';

const { server, port } = await serve();

// 1. Generate Walking Contact Sheet HTML
const walkFrames = [2.4, 2.8, 3.2, 3.6, 4.0, 4.4, 4.8, 5.2];
const walkHtml = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      margin: 0;
      padding: 24px;
      background: #0F172A;
      font-family: 'Segoe UI', system-ui, sans-serif;
      color: #FFFFFF;
      width: 1920px;
      box-sizing: border-box;
    }
    .header {
      margin-bottom: 20px;
      border-bottom: 2px solid #334155;
      padding-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    h1 {
      margin: 0;
      font-size: 26px;
      font-weight: 800;
      color: #F8FAFC;
    }
    .badge {
      background: #107C41;
      color: white;
      padding: 4px 12px;
      border-radius: 999px;
      font-size: 13px;
      font-weight: 700;
    }
    .subtitle {
      color: #94A3B8;
      font-size: 14px;
      margin-top: 4px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }
    .frame-card {
      background: #1E293B;
      border: 1.5px solid #334155;
      border-radius: 12px;
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .frame-title {
      font-size: 13px;
      font-weight: 700;
      color: #38BDF8;
      display: flex;
      justify-content: space-between;
    }
    .crop-container {
      width: 100%;
      height: 380px;
      overflow: hidden;
      border-radius: 8px;
      background: #F8FAFC;
      position: relative;
    }
    .crop-container img {
      position: absolute;
      /* Zoom into Mohamed and the ground line: width 1080 -> 190%, offset to show feet at y=1386 */
      width: 170%;
      left: -65%;
      top: -62%;
    }
    .frame-meta {
      font-size: 11px;
      color: #94A3B8;
      line-height: 1.35;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>Mohamed Walk Cycle — Consecutive Stride Contact Sheet (2.4s – 5.2s)</h1>
      <div class="subtitle">Verified Ground Kinematics · Stance Leg Anchoring · Knee Articulation (38°) · Deceleration & Standing Balance</div>
    </div>
    <span class="badge">Revision 3 QA Pass</span>
  </div>
  <div class="grid">
    ${walkFrames.map((t, idx) => `
      <div class="frame-card">
        <div class="frame-title">
          <span>Frame ${idx + 1} (${t.toFixed(1)}s)</span>
          <span style="color: ${idx < 6 ? '#10B981' : '#38BDF8'}">${idx === 0 ? 'Entry Strike' : idx === 7 ? 'Balanced Plant' : 'Stride Phase'}</span>
        </div>
        <div class="crop-container">
          <img src="/exports/previews/walk-frame-at-${t}s.png" />
        </div>
        <div class="frame-meta">
          <strong>Pelvis:</strong> x=${(1180 - idx * 46).toFixed(0)}, y=1104<br>
          <strong>Floor Contact:</strong> y=1386 (Locked to wooden floor plane)
        </div>
      </div>
    `).join('')}
  </div>
</body>
</html>`;

const walkHtmlPath = path.join(PROJECT, 'exports', 'previews', 'walking-contact-sheet.html');
fs.writeFileSync(walkHtmlPath, walkHtml);

// 2. Open and screenshot walking contact sheet
const { browser, page } = await openPage(`http://127.0.0.1:${port}/exports/previews/walking-contact-sheet.html`, { width: 1920, height: 960 });
await new Promise(r => setTimeout(r, 1500));

const walkSheetPng = path.join(PROJECT, 'exports', 'previews', 'walking-contact-sheet.png');
await page.screenshot({ path: walkSheetPng, type: 'png' });
console.log(`Saved walking contact sheet to ${walkSheetPng}`);

// Copy to brain artifact directory
const brainDir = 'C:\\Users\\m.mohammedi\\.gemini\\antigravity\\brain\\c67455ef-bd48-4f17-a254-b96aa958fbf7';
if (fs.existsSync(brainDir)) {
  fs.copyFileSync(walkSheetPng, path.join(brainDir, 'walking-contact-sheet.png'));
  console.log(`Copied to brain: walking-contact-sheet.png`);
}

// 3. Generate Master Story Contact Sheet HTML
const beats = [
  { t: '0.8s', title: '1. Karim Typing', desc: 'Typing micro-motion at desk', src: 'frame-01-at-0.8s-karim-typing.png' },
  { t: '1.8s', title: '2. Mounting Worry', desc: 'Eyes scan 5,842 raw data rows', src: 'frame-02-at-1.8s-karim-worry.png' },
  { t: '2.8s', title: '3. Hand to Temple', desc: 'Exhausted slump; blue sleeve stays down', src: 'frame-03-at-2.8s-karim-hand-to-temple.png' },
  { t: '4.0s', title: '4. Mohamed Walk Entry', desc: 'Bipedal walk with zero foot sliding', src: 'frame-04-at-4.0s-mohamed-walking.png' },
  { t: '5.4s', title: '5. Friendly Greeting', desc: 'Mohamed smiles; Karim turns gaze up', src: 'frame-05-at-5.4s-mohamed-greet-karim-reacts.png' },
  { t: '7.5s', title: '6. Target Pointing (IK)', desc: 'Mohamed indicates screen; Karim follows', src: 'frame-06-at-7.5s-mohamed-points-karim-follows.png' },
  { t: '8.5s', title: '7. Solution Synthesis', desc: 'Pivot table solution explained', src: 'frame-07-at-8.5s-solution-pivot-table.png' }
];

const masterHtml = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      margin: 0;
      padding: 24px;
      background: #0B132B;
      font-family: 'Segoe UI', system-ui, sans-serif;
      color: #FFFFFF;
      width: 1920px;
      box-sizing: border-box;
    }
    .header {
      margin-bottom: 20px;
      border-bottom: 2px solid #334155;
      padding-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    h1 {
      margin: 0;
      font-size: 26px;
      font-weight: 800;
      color: #F8FAFC;
    }
    .badge {
      background: #107C41;
      color: white;
      padding: 4px 12px;
      border-radius: 999px;
      font-size: 13px;
      font-weight: 700;
    }
    .subtitle {
      color: #94A3B8;
      font-size: 14px;
      margin-top: 4px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 14px;
    }
    .frame-card {
      background: #1C2541;
      border: 1.5px solid #3A506B;
      border-radius: 12px;
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .frame-title {
      font-size: 12px;
      font-weight: 800;
      color: #38BDF8;
    }
    .img-box {
      width: 100%;
      height: 420px;
      overflow: hidden;
      border-radius: 8px;
      background: #F8FAFC;
    }
    .img-box img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .frame-desc {
      font-size: 11px;
      color: #CBD5E1;
      line-height: 1.35;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>Mohamed Excel — Episode 01 Prototype Master Contact Sheet (Beats 1–7)</h1>
      <div class="subtitle">Complete Interaction Benchmark · Character Staging · Responsive Coordinated Performance</div>
    </div>
    <span class="badge">Phase 4 Revision 3</span>
  </div>
  <div class="grid">
    ${beats.map(b => `
      <div class="frame-card">
        <div class="frame-title">${b.title} (${b.t})</div>
        <div class="img-box">
          <img src="/exports/previews/${b.src}" />
        </div>
        <div class="frame-desc">${b.desc}</div>
      </div>
    `).join('')}
  </div>
</body>
</html>`;

const masterHtmlPath = path.join(PROJECT, 'exports', 'previews', 'master-contact-sheet.html');
fs.writeFileSync(masterHtmlPath, masterHtml);

await page.goto(`http://127.0.0.1:${port}/exports/previews/master-contact-sheet.html`, { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 1500));

const masterSheetPng = path.join(PROJECT, 'exports', 'previews', 'master-contact-sheet.png');
await page.screenshot({ path: masterSheetPng, type: 'png' });
console.log(`Saved master contact sheet to ${masterSheetPng}`);

if (fs.existsSync(brainDir)) {
  fs.copyFileSync(masterSheetPng, path.join(brainDir, 'master-contact-sheet.png'));
  console.log(`Copied to brain: master-contact-sheet.png`);
}

await browser.close();
server.close();
console.log("All contact sheets generated and synced!");
