import asyncio
import edge_tts
import subprocess
import json

phrases_tight = [
    ("s1", "Analyser vos données sur Excel prend trop de temps ?"),
    ("s2", "Découvrez les Tableaux Croisés Dynamiques !"),
    ("s3", "Visualisez vos résultats avec des graphiques clairs."),
    ("s4", "13 vidéos HD et exercices avec Mohamed Excel."),
    ("s5", "Seulement 1 500 dinars sur courses.techwise-dz.com !")
]

async def measure():
    print("--- HENRI (Male) ---")
    tot = 0
    for name, text in phrases_tight:
        out = f"D:/source/TWA/ExcelMohamed/projects/mohamed-excel-tcd/public/audio/tight_m_{name}.mp3"
        tts = edge_tts.Communicate(text, "fr-FR-HenriNeural", rate="+15%")
        await tts.save(out)
        res = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "json", out], capture_output=True, text=True)
        dur = float(json.loads(res.stdout)["format"]["duration"])
        tot += dur
        print(f"{name} ({dur:.2f}s): {text}")
    print(f"Total spoken duration: {tot:.2f}s")

    print("\n--- DENISE (Female) ---")
    tot_f = 0
    for name, text in phrases_tight:
        out = f"D:/source/TWA/ExcelMohamed/projects/mohamed-excel-tcd/public/audio/tight_f_{name}.mp3"
        tts = edge_tts.Communicate(text, "fr-FR-DeniseNeural", rate="+15%")
        await tts.save(out)
        res = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "json", out], capture_output=True, text=True)
        dur = float(json.loads(res.stdout)["format"]["duration"])
        tot_f += dur
        print(f"{name} ({dur:.2f}s): {text}")
    print(f"Total spoken duration: {tot_f:.2f}s")

if __name__ == "__main__":
    asyncio.run(measure())
