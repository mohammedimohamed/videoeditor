import asyncio
import edge_tts
import subprocess
import json
import os

# Script for each scene
# Scene 1 (0.0s - 3.0s): Hook
# Scene 2 (3.0s - 6.0s): Solution / TCD
# Scene 3 (6.0s - 9.0s): Visualisation & Clarté
# Scene 4 (9.0s - 12.0s): Offre Mohamed Excel
# Scene 5 (12.0s - 15.0s): Tarif & Inscription

lines_male = [
    ("s1_male", "Vous utilisez Excel au quotidien, mais analyser vos données vous prend trop de temps ?"),
    ("s2_male", "Découvrez les Tableaux Croisés Dynamiques pour regrouper et synthétiser vos données."),
    ("s3_male", "Des graphiques dynamiques pour mieux comprendre vos résultats."),
    ("s4_male", "Avec Mohamed Excel, profitez de 13 vidéos HD à votre rythme."),
    ("s5_male", "Formation à 1 500 dinars sur courses point techwise tiret dz point com.")
]

lines_female = [
    ("s1_female", "Vous utilisez Excel au quotidien, mais analyser vos données vous prend trop de temps ?"),
    ("s2_female", "Découvrez les Tableaux Croisés Dynamiques pour regrouper et synthétiser vos données."),
    ("s3_female", "Des graphiques dynamiques pour mieux comprendre vos résultats."),
    ("s4_female", "Avec Mohamed Excel, profitez de 13 vidéos HD à votre rythme."),
    ("s5_female", "Formation à 1 500 dinars sur courses point techwise tiret dz point com.")
]

async def generate():
    os.makedirs("D:/source/TWA/ExcelMohamed/projects/mohamed-excel-tcd/public/audio", exist_ok=True)
    print("=== MALE (Henri) ===")
    for id_name, text in lines_male:
        path = f"D:/source/TWA/ExcelMohamed/projects/mohamed-excel-tcd/public/audio/{id_name}.mp3"
        tts = edge_tts.Communicate(text, "fr-FR-HenriNeural", rate="+12%")
        await tts.save(path)
        res = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "json", path], capture_output=True, text=True)
        dur = float(json.loads(res.stdout)["format"]["duration"])
        print(f"{id_name}: {dur:.2f}s | {text}")

    print("\n=== FEMALE (Denise) ===")
    for id_name, text in lines_female:
        path = f"D:/source/TWA/ExcelMohamed/projects/mohamed-excel-tcd/public/audio/{id_name}.mp3"
        tts = edge_tts.Communicate(text, "fr-FR-DeniseNeural", rate="+12%")
        await tts.save(path)
        res = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "json", path], capture_output=True, text=True)
        dur = float(json.loads(res.stdout)["format"]["duration"])
        print(f"{id_name}: {dur:.2f}s | {text}")

if __name__ == "__main__":
    asyncio.run(generate())
