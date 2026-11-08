import { synthesizeGemini } from "../../../.agents/skills/media-use/audio/scripts/lib/gemini-tts.mjs";
import { execSync } from "node:child_process";

process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

const voices = ["Puck", "Fenrir", "Charon", "Kore", "Aoede"];
const sampleText = "Découvrez les Tableaux Croisés Dynamiques avec Mohamed Excel, formation complète à 1 500 dinars.";

async function testVoices() {
  for (const v of voices) {
    const out = `D:/source/TWA/ExcelMohamed/projects/mohamed-excel-tcd/public/audio/gemini_sample_${v}.wav`;
    console.log(`Generating with voice ${v}...`);
    const res = await synthesizeGemini({
      text: sampleText,
      voiceId: v,
      model: "gemini-2.5-flash-preview-tts",
      wavAbs: out
    });
    if (res.ok) {
      const dur = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${out}"`).toString().trim();
      console.log(`Voice ${v} generated successfully: duration = ${parseFloat(dur).toFixed(2)}s`);
    } else {
      console.error(`Voice ${v} failed:`, res.error);
    }
  }
}

testVoices().catch(console.error);
