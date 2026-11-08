import asyncio
import edge_tts
import subprocess
import json
import os

phrases = [
    # Scene 1 (0-3s): "Analyser vos données sur Excel prend trop de temps ?"
    ("s1", "Analyser vos données sur Excel prend trop de temps ?", "+20%"),
    # Scene 2 (3-6s): "Découvrez les Tableaux Croisés Dynamiques !"
    ("s2", "Découvrez les Tableaux Croisés Dynamiques !", "+14%"),
    # Scene 3 (6-9s): "Visualisez vos résultats avec des graphiques clairs."
    ("s3", "Visualisez vos résultats avec des graphiques clairs.", "+20%"),
    # Scene 4 (9-12s): "13 vidéos HD et classeurs inclus."
    ("s4", "13 vidéos HD et classeurs d'exercices inclus.", "+22%"),
    # Scene 5 (12-15s): "1 500 dinars sur courses.techwise-dz.com !"
    ("s5", "1 500 dinars sur courses.techwise-dz.com !", "+30%")
]

offsets = [0.15, 3.05, 6.05, 9.05, 11.50]

async def build_voiceover(voice_name, gender_tag):
    temp_files = []
    print(f"Generating for {voice_name} ({gender_tag})...")
    for i, (key, text, rate) in enumerate(phrases):
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
