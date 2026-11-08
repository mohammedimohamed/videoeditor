import { synthesizeGemini } from "../../../.agents/skills/media-use/audio/scripts/lib/gemini-tts.mjs";
import { execSync } from "node:child_process";
import { setTimeout } from "node:timers/promises";

process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

const phrases = [
  { id: "s1", text: "Analyser vos données sur Excel prend trop de temps ?", maxDur: 2.75 },
  { id: "s2", text: "Découvrez les Tableaux Croisés Dynamiques !", maxDur: 2.75 },
  { id: "s3", text: "Visualisez vos données avec des graphiques clairs.", maxDur: 2.75 },
  { id: "s4", text: "13 vidéos HD et classeurs d'exercices inclus.", maxDur: 2.75 },
  { id: "s5", text: "1 500 dinars sur courses.techwise-dz.com !", maxDur: 2.75 }
];

const offsets = [0.15, 3.10, 6.10, 9.10, 12.10];

async function generateVoice(voiceId, voiceLabel) {
  console.log(`\n======================================================`);
  console.log(`Generating Gemini 3.8 Flash Lite TTS: ${voiceLabel} (${voiceId})`);
  console.log(`======================================================`);

  const calibratedFiles = [];

  for (let i = 0; i < phrases.length; i++) {
    const item = phrases[i];
    const rawWav = `D:/source/TWA/ExcelMohamed/projects/mohamed-excel-tcd/public/audio/gemini38_${voiceId}_${item.id}_raw.wav`;
    const calWav = `D:/source/TWA/ExcelMohamed/projects/mohamed-excel-tcd/public/audio/gemini38_${voiceId}_${item.id}.wav`;

    console.log(`\n[Scene ${i + 1}] Synthesizing "${item.text}"...`);
    
    let ok = false;
    let attempts = 0;
    while (!ok && attempts < 3) {
      attempts++;
      const res = await synthesizeGemini({
        text: item.text,
        voiceId: voiceId,
        model: "gemini-3.8-flash-lite-tts",
        wavAbs: rawWav
      });

      if (res.ok) {
        ok = true;
      } else {
        console.warn(`  Attempt ${attempts} failed: ${res.error}. Waiting 25s...`);
        await setTimeout(25000);
      }
    }

    if (!ok) {
      throw new Error(`Failed to synthesize scene ${i + 1} after 3 attempts.`);
    }

    // Measure raw duration
    const rawDur = parseFloat(
      execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${rawWav}"`)
        .toString()
        .trim()
    );
    console.log(`  -> Raw duration: ${rawDur.toFixed(2)}s (max allowed: ${item.maxDur}s)`);

    // Calibrate with atempo if needed to guarantee no scene overlap
    if (rawDur > item.maxDur) {
      const tempo = (rawDur / item.maxDur).toFixed(3);
      console.log(`  -> Calibrating with atempo=${tempo}...`);
      execSync(`ffmpeg -y -i "${rawWav}" -filter:a "atempo=${tempo}" "${calWav}" -loglevel error`);
    } else {
      execSync(`ffmpeg -y -i "${rawWav}" -c copy "${calWav}" -loglevel error`);
    }

    const finalDur = parseFloat(
      execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${calWav}"`)
        .toString()
        .trim()
    );
    const end = offsets[i] + finalDur;
    console.log(`  -> Calibrated Scene ${i + 1}: [${offsets[i].toFixed(2)}s - ${end.toFixed(2)}s] (duration: ${finalDur.toFixed(2)}s)`);

    calibratedFiles.push({ path: calWav, offset: offsets[i], dur: finalDur });

    if (i < phrases.length - 1) {
      console.log("  Waiting 21s for rate-limit window...");
      await setTimeout(21000);
    }
  }

  // Assemble full voice track
  console.log(`\nAssembling full voice track for ${voiceLabel}...`);
  const fullVoice = `D:/source/TWA/ExcelMohamed/projects/mohamed-excel-tcd/public/audio/voiceover_gemini38_${voiceId}.mp3`;
  
  const filterInputs = calibratedFiles.map((f, idx) => {
    const delayMs = Math.round(f.offset * 1000);
    return `[${idx}:a]adelay=${delayMs}|${delayMs}[a${idx}]`;
  }).join(";");
  
  const mixInputs = calibratedFiles.map((_, idx) => `[a${idx}]`).join("");
  const cmdVoice = `ffmpeg -y ${calibratedFiles.map(f => `-i "${f.path}"`).join(" ")} -filter_complex "${filterInputs};${mixInputs}amix=inputs=${calibratedFiles.length}:normalize=0[aout]" -map "[aout]" -t 15.000 "${fullVoice}" -loglevel error`;
  execSync(cmdVoice);
  console.log(`  -> Voice track created: ${fullVoice}`);

  // Master mix with corporate BGM
  console.log(`Mixing with Corporate BGM...`);
  const bgm = `D:/source/TWA/ExcelMohamed/projects/mohamed-excel-tcd/public/audio/corporate_bgm.mp3`;
  const masterAudio = `D:/source/TWA/ExcelMohamed/projects/mohamed-excel-tcd/public/audio/master_audio_gemini38_${voiceId}.mp3`;

  // BGM volume: 0.12 (-18.4 dB), Voice volume: 1.0 (0 dB), Master limiter, fadeout at 14.5s
  const cmdMaster = `ffmpeg -y -i "${bgm}" -i "${fullVoice}" -filter_complex "[0:a]volume=0.12,afade=t=out:st=14.5:d=0.5[bgm];[1:a]volume=1.0[voice];[bgm][voice]amix=inputs=2:duration=longest:normalize=0,alimiter=limit=0.95[out]" -map "[out]" -t 15.048 "${masterAudio}" -loglevel error`;
  execSync(cmdMaster);

  const masterDur = parseFloat(
    execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${masterAudio}"`)
      .toString()
      .trim()
  );
  console.log(`  -> Master Audio created: ${masterAudio} (duration: ${masterDur.toFixed(2)}s)`);
  return masterAudio;
}

async function main() {
  // Generate Fenrir (male)
  await generateVoice("Fenrir", "Male Voice (Fenrir)");
  console.log("\nWaiting 25s before generating Kore...");
  await setTimeout(25000);
  // Generate Kore (female)
  await generateVoice("Kore", "Female Voice (Kore)");
  console.log("\nALL GEMINI 3.8 FLASH LITE AUDIO TRACKS SUCCESSFULLY GENERATED!");
}

main().catch(err => {
  console.error("FATAL ERROR in main:", err);
  process.exit(1);
});
