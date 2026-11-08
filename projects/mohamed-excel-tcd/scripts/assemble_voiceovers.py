import asyncio
import edge_tts
import subprocess
import json
import os

# We want 5 lines that match the script closely, speak with crystal clarity,
# and each fit within ~2.3 - 2.6 seconds so they stay strictly within their scene:

# Scene 1 (0s-3s): "Vous utilisez Excel, mais analyser vos données prend trop de temps ?"
# Scene 2 (3s-6s): "Découvrez les Tableaux Croisés Dynamiques !"
# Scene 3 (6s-9s): "Visualisez vos résultats avec des graphiques clairs."
# Scene 4 (9s-12s): "13 vidéos HD et classeurs inclus avec Mohamed Excel."
# Scene 5 (12s-15s): "Seulement 1 500 dinars sur courses point techwise tiret dz point com."

# Note: On "1 500 dinars", French TTS says "mille cinq cents dinars", exactly matching Algerian French usage!

phrases = [
    ("s1", "Vous utilisez Excel, mais analyser vos données prend trop de temps ?", "+18%"),
    ("s2", "Découvrez les Tableaux Croisés Dynamiques !", "+12%"),
    ("s3", "Visualisez vos résultats avec des graphiques clairs.", "+14%"),
    ("s4", "13 vidéos HD et classeurs d'exercices avec Mohamed Excel.", "+18%"),
    ("s5", "Seulement 1 500 dinars sur courses point techwise tiret dz point com.", "+22%")
]

offsets = [0.15, 3.10, 6.10, 9.10, 12.10]

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
        print(f"  Scene {i+1} [{offsets[i]:.2f}s - {end_time:.2f}s] ({dur:.2f}s): {text}")
        temp_files.append((tmp_path, offsets[i], dur))

    # Assemble into master 15.00s track using ffmpeg adelay and amix
    # Create an empty 15.000s base silent track first
    master_path = f"D:/source/TWA/ExcelMohamed/projects/mohamed-excel-tcd/public/audio/voiceover_{gender_tag}.mp3"
    
    # Use ffmpeg complex filter to position each clip at its exact timestamp
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
