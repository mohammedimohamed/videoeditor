import asyncio
import edge_tts
import subprocess
import json

# Let's test a concise, high-impact advertising voiceover that preserves all key terms:
# - "Tableaux Croisés Dynamiques"
# - "Excel"
# - "1 500 dinars"
# - "13 vidéos HD" & "classeurs"
# - "courses.techwise-dz.com"

# Let's test scene-by-scene timing targeted to ~2.5s per scene (total <= 14.5s):
candidate_lines = [
    # Scene 1 (0-3s): Hook (target <= 2.8s)
    ("s1_v1", "Analyser vos données sur Excel vous prend trop de temps ?"),
    ("s1_v2", "Excel au quotidien, mais analyser vos données prend trop de temps ?"),
    
    # Scene 2 (3-6s): Solution (target <= 2.6s)
    ("s2_v1", "Découvrez les Tableaux Croisés Dynamiques !"),
    ("s2_v2", "Découvrez les Tableaux Croisés Dynamiques pour synthétiser vos données."),
    
    # Scene 3 (6-9s): Visualisation (target <= 2.6s)
    ("s3_v1", "Des graphiques dynamiques pour mieux comprendre vos résultats."),
    ("s3_v2", "Obtenez des analyses plus claires et visualisez vos résultats."),
    
    # Scene 4 (9-12s): Offre (target <= 2.6s)
    ("s4_v1", "Avec Mohamed Excel, 13 vidéos HD et classeurs d'exercices."),
    ("s4_v2", "Profitez de 13 vidéos HD et classeurs d'exercices à votre rythme."),
    
    # Scene 5 (12-15s): CTA (target <= 2.6s)
    ("s5_v1", "Formation à 1 500 dinars sur courses.techwise-dz.com !"),
    ("s5_v2", "Seulement 1 500 dinars sur courses point techwise tiret dz point com.")
]

async def test():
    for name, text in candidate_lines:
        out = f"D:/source/TWA/ExcelMohamed/projects/mohamed-excel-tcd/public/audio/cand_{name}.mp3"
        tts = edge_tts.Communicate(text, "fr-FR-HenriNeural", rate="+15%")
        await tts.save(out)
        res = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "json", out], capture_output=True, text=True)
        dur = float(json.loads(res.stdout)["format"]["duration"])
        print(f"{name} ({dur:.2f}s): {text}")

if __name__ == "__main__":
    asyncio.run(test())
