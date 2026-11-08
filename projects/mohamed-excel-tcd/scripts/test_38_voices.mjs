import { synthesizeGemini } from "../../../.agents/skills/media-use/audio/scripts/lib/gemini-tts.mjs";
import { execSync } from "node:child_process";

process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

async function testVoice(voiceId) {
  const wavAbs = `D:/source/TWA/ExcelMohamed/projects/mohamed-excel-tcd/public/audio/test_${voiceId}_38.wav`;
  console.log(`Testing ${voiceId} with gemini-3.8-flash-lite-tts...`);
  const res = await synthesizeGemini({
    text: "Analyser vos données sur Excel prend trop de temps ?",
    voiceId: voiceId,
    model: "gemini-3.8-flash-lite-tts",
    wavAbs: wavAbs
  });
  if (res.ok) {
    const dur = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${wavAbs}"`).toString().trim();
    console.log(`  ${voiceId} SUCCESS: duration = ${parseFloat(dur).toFixed(2)}s`);
  } else {
    console.log(`  ${voiceId} FAILED:`, res.error);
  }
}

async function run() {
  await testVoice("Fenrir");
  await new Promise(r => setTimeout(r, 21000));
  await testVoice("Kore");
}

run();
