import { synthesizeGemini } from "../../../.agents/skills/media-use/audio/scripts/lib/gemini-tts.mjs";

process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

async function main() {
  const models = [
    "gemini-2.5-flash-preview-tts",
    "gemini-3.8-flash-lite-tts",
    "gemini-3.8-flash-tts"
  ];
  for (const model of models) {
    console.log(`Testing model: ${model}...`);
    const res = await synthesizeGemini({
      text: "Bonjour, découvrez les Tableaux Croisés Dynamiques avec Mohamed Excel.",
      voiceId: "Kore",
      model: model,
      wavAbs: `D:/source/TWA/ExcelMohamed/projects/mohamed-excel-tcd/public/audio/test_gemini_${model}.wav`
    });
    console.log(`Result for ${model}:`, res);
    if (res.ok) break;
  }
}

main().catch(console.error);
