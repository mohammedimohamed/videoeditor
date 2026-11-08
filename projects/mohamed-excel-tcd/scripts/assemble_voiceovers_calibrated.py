import asyncio
import edge_tts
import subprocess
import json
import os

# Exactly calibrated phrases so that:
# Scene 1: 0.15s -> < 2.80s (ends before Scene 2 cut at 3.0s)
# Scene 2: 3.10s -> < 5.80s (ends before Scene 3 cut at 6.0s)
# Scene 3: 6.10s -> < 8.80s (ends before Scene 4 cut at 9.0s)
# Scene 4: 9.10s -> < 11.80s (ends before Scene 5 cut at 12.0s)
# Scene 5: 12.05s -> < 14.70s (ends before final cut at 15.0s)

phrases_calibrated = [
    ("s1", "Analyser vos données sur Excel prend trop de temps ?", "+20%"),
    ("s2", "Découvrez les Tableaux Croisés Dynamiques !", "+14%"),
    ("s3", "Visualisez vos résultats avec des graphiques clairs.", "+18%"),
    ("s4", "13 vidéos HD et classeurs d'exercices inclus.", "+18%"),
    ("s5", "Seulement 1 500 dinars sur courses.techwise-dz.com !", "+25%")
]

offsets = [0.15, 3.10, 6.10, 9.10, 12.05]

async def build_voiceover(voice_name, gender_tag):
    temp_files = []
    print(f"Generating for {voice_name} ({gender_tag})...")
    for i, (key, text, rate) in enumerate(phrases_calibrated):
        tmp_path = f"D:/source/TWA/ExcelMohamed/projects/mohamed-excel-tcd/public/audio/{gender_tag}_{key}.mp3"
        tts = edge_tts.Communicate(text, voice_name, rate=rate)
        await tts.save(tmp_path)
        res = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "json", tmp_path], capture_output=True, text=True)
        dur = float(json.loads(res.stdout)["format"]["duration"])
        end_time = offsets[i] + dur
        print(f"  Scene {i+1} [{offsets[i]:.2f}s - {end_time:.2f}s] (dur: {dur:.2f}s): {text}")
        temp_files.append((tmp_path, offsets[i], dur))

    master_path = f"D:/source/TWA/ExcelMohamed/projects/mohamed-excel-tcd/public/audio/voiceover_{gender_tag}.mp3"
    
    filter_inputs = []
    for i, (path, offset, dur) in enumerate(temp_files):
        delay_ms = int(offset * 1000)
        filter_inputs.append(f"[{i}:a]adelay={delay_ms}|{delay_ms}[a{i}]")
    
    mix_inputs = "".join([f"[a{i}]" for i in range(len(temp_files))])
    filter_str = ";".join(filter_inputs) + f";{mix_inputs}amix=inputs={len(temp_files)}:normalize=0[aout]"
    
    cmd = ["ffmpeg", "-y"]
    for path, _, _ in temp_files:
        cmd.extend(["-i", path])
    cmd.extend(["-filter_complex", filter_str, "-map", "[aout]", "-t", "15.000", "-b:a", "192k", master_path])
    
    subprocess.run(cmd, check=True, capture_output=True)
    res = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "json", master_path], capture_output=True, text=True)
    final_dur = float(json.loads(res.stdout)["format"]["duration"])
    print(f"Master voiceover {gender_tag} created: {master_path} ({final_dur:.2f}s)")

async def main():
    await build_voiceover("fr-FR-HenriNeural", "homme")
    await build_voiceover("fr-FR-DeniseNeural", "femme")

if __name__ == "__main__":
    asyncio.run(main())
