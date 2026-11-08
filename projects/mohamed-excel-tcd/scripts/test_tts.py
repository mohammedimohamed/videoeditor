import asyncio
import edge_tts
import subprocess
import json

text = """Vous utilisez Excel au quotidien, mais analyser vos données vous prend trop de temps ?
Découvrez les Tableaux Croisés Dynamiques.
Apprenez à regrouper, filtrer et synthétiser vos données pour obtenir des analyses plus claires.
Avec Mohamed Excel, profitez de 13 vidéos HD et de classeurs d'exercices pour apprendre à votre rythme.
La formation complète est à seulement 1 500 dinars.
Inscrivez-vous directement sur courses.techwise-dz.com."""

async def main():
    rates = ["+0%", "+10%", "+15%", "+20%", "+25%"]
    for r in rates:
        clean_r = r.replace("+", "").replace("%", "")
        out = f"D:/source/TWA/ExcelMohamed/projects/mohamed-excel-tcd/public/audio/test_full_{clean_r}.mp3"
        tts = edge_tts.Communicate(text, "fr-FR-HenriNeural", rate=r)
        await tts.save(out)
        res = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "json", out], capture_output=True, text=True)
        dur = json.loads(res.stdout)["format"]["duration"]
        print(f"Rate: {r} -> Duration: {dur}s")

if __name__ == "__main__":
    asyncio.run(main())
