import asyncio
import edge_tts
import subprocess
import json

phrases = [
    ("s1", "Vous utilisez Excel, mais analyser vos données prend trop de temps ?"),
    ("s2", "Découvrez les Tableaux Croisés Dynamiques pour synthétiser vos données."),
    ("s3", "Des graphiques dynamiques pour mieux visualiser vos résultats."),
    ("s4", "13 vidéos HD et exercices avec Mohamed Excel, à votre rythme."),
    ("s5", "Formation à 1 500 dinars sur courses point techwise tiret dz point com.")
]

async def measure():
    print("--- RATE +20% (Henri - Male) ---")
    tot = 0
    for name, text in phrases:
        out = f"D:/source/TWA/ExcelMohamed/projects/mohamed-excel-tcd/public/audio/test_m_{name}.mp3"
        tts = edge_tts.Communicate(text, "fr-FR-HenriNeural", rate="+20%")
        await tts.save(out)
        res = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "json", out], capture_output=True, text=True)
        dur = float(json.loads(res.stdout)["format"]["duration"])
        tot += dur
        print(f"{name} ({dur:.2f}s): {text}")
    print(f"Total spoken duration: {tot:.2f}s (budget: 15.0s)")

    print("\n--- RATE +20% (Denise - Female) ---")
    tot_f = 0
    for name, text in phrases:
        out = f"D:/source/TWA/ExcelMohamed/projects/mohamed-excel-tcd/public/audio/test_f_{name}.mp3"
        tts = edge_tts.Communicate(text, "fr-FR-DeniseNeural", rate="+20%")
        await tts.save(out)
        res = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "json", out], capture_output=True, text=True)
        dur = float(json.loads(res.stdout)["format"]["duration"])
        tot_f += dur
        print(f"{name} ({dur:.2f}s): {text}")
    print(f"Total spoken duration: {tot_f:.2f}s (budget: 15.0s)")

if __name__ == "__main__":
    asyncio.run(measure())
