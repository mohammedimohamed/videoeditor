import { synthesizeGemini } from "../../../.agents/skills/media-use/audio/scripts/lib/gemini-tts.mjs";
import { execSync } from "node:child_process";
import { setTimeout } from "node:timers/promises";

process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

// Crisp, concise sentences tailored for 3-second scene pacing with Gemini TTS:
const phrases = [
  { id: "s1", text: "Analyser vos données sur Excel prend trop de temps ?" },
  { id: "s2", text: "Découvrez les Tableaux Croisés Dynamiques !" },
  { id: "s3", text: "Visualisez vos données avec des graphiques clairs." },
  { id: "s4", text: "13 vidéos HD et classeurs d'exercices inclus." },
  { id: "s5", text: "1 500 dinars sur courses.techwise-dz.com !" }
];

const offsets = [0.15, 3.05, 6.05, 9.05, 11.60];

async function main() {
  console.log("=== Generating Clean Gemini Flash TTS Voiceover (Fenrir) ===");
  const tempFiles = [];

  for (let i = 0; i < phrases.length; i++) {
    const item = phrases[i];
    const outWav = `D:/source/TWA/ExcelMohamed/projects/mohamed-excel-tcd/public/audio/gemini_clean_${item.id}.wav`;
    console.log(`Generating Scene ${i + 1} (${item.id}): "${item.text}"...`);
    
    let success = false;
    let attempts = 0;
    while (!success && attempts < 4) {
      attempts++;
      const res = await synthesizeGemini({
        text: item.text,
        voiceId: "Fenrir",
        model: "gemini-2.5-flash-preview-tts",
        wavAbs: outWav
      });

      if (res.ok) {
        success = true;
        const dur = parseFloat(
          execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${outWav}"`)
            .toString()
            .trim()
        );
        const end = offsets[i] + dur;
        console.log(`  -> Scene ${i + 1} OK: [${offsets[i].toFixed(2)}s - ${end.toFixed(2)}s] (duration: ${dur.toFixed(2)}s)`);
        tempFiles.push({ path: outWav, offset: offsets[i], dur });
      } else {
        console.warn(`  Attempt ${attempts} failed (${res.error}). Waiting 25s before retry...`);
        await setTimeout(25000);
      }
    }

    if (i < phrases.length - 1) {
      console.log("Waiting 22s for Gemini Free Tier rate-limit window...");
      await setTimeout(22000);
    }
  }

  console.log("\nAssembling master Gemini voiceover track with FFmpeg...");
  const masterVoice = "D:/source/TWA/ExcelMohamed/projects/mohamed-excel-tcd/public/audio/voiceover_gemini_fenrir.mp3";
  
  const filterInputs = tempFiles.map((f, idx) => {
    const delayMs = Math.round(f.offset * 1000);
    return `[${idx}:a]adelay=${delayMs}|${delayMs}[a${idx}]`;
  }).join(";");
  
  const mixInputs = tempFiles.map((_, idx) => `[a${idx}]`).join("");
  const filterComplex = `${filterInputs};${mixInputs}amix=inputs=${tempFiles.length}:normalize=0[aout]`;

  const inputArgs = tempFiles.flatMap(f => ["-i", f.path]);
  const cmd = `ffmpeg -y ${inputArgs.join(" ")} -filter_complex "${filterComplex}" -map "[aout]" -t 15.000 -b:a 192k "${masterVoice}"`;
  execSync(cmd);

  console.log("Mixing with corporate background music...");
  const bgm = "D:/source/TWA/ExcelMohamed/projects/mohamed-excel-tcd/public/audio/corporate_bgm.mp3";
  const masterMix = "D:/source/TWA/ExcelMohamed/projects/mohamed-excel-tcd/public/audio/master_audio_gemini.mp3";
  
  const mixCmd = `ffmpeg -y -i "${bgm}" -i "${masterVoice}" -filter_complex "[0:a]volume=0.15[m];[1:a]volume=1.0[v];[v][m]amix=inputs=2:duration=longest:dropout_transition=0:normalize=0[mixed];[mixed]alimiter=limit=0.95[aout]" -map "[aout]" -t 15.000 -b:a 192k "${masterMix}"`;
  execSync(mixCmd);

  const finalDur = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${masterMix}"`).toString().trim();
  console.log(`\nGemini Master Audio created successfully: ${masterMix} (${parseFloat(finalDur).toFixed(2)}s)`);
}

main().catch(console.error);
