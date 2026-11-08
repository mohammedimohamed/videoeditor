import asyncio
import edge_tts
import subprocess
import json

lines = [
    ("s1", "Vous utilisez Excel au quotidien, mais analyser vos données vous prend trop de temps ?"),
    ("s2", "Découvrez les Tableaux Croisés Dynamiques pour regrouper et filtrer vos données."),
    ("s3", "Des graphiques dynamiques pour mieux comprendre vos résultats."),
    ("s4", "Avec Mohamed Excel, profitez de 13 vidéos HD à votre rythme."),
    ("s5", "Formation à 1 500 dinars sur courses point techwise tiret dz point com.")
]

# Also test the original lines:
lines_orig = [
    ("s1_orig", "Vous utilisez Excel au quotidien, mais analyser vos données prend trop de temps ?"),
    ("s2_orig", "Découvrez les Tableaux Croisés Dynamiques."),
    ("s3_orig", "Obtenez des analyses plus claires."),
    ("s4_orig", "Avec Mohamed Excel, 13 vidéos HD et classeurs d'exercices inclus."),
    ("s5_orig", "Seulement 1 500 dinars sur courses.techwise-dz.com.")
]

async def check():
    for name, text in lines + lines_orig:
        out = f"D:/source/TWA/ExcelMohamed/projects/mohamed-excel-tcd/public/audio/{name}.mp3"
        tts = edge_tts.Communicate(text, "fr-FR-HenriNeural", rate="+15%")
        await tts.save(out)
        res = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "json", out], capture_output=True, text=True)
        dur = float(json.loads(res.stdout)["format"]["duration"])
        print(f"{name}: {dur:.2f}s -> {text}")

if __name__ == "__main__":
    asyncio.run(check())
