import subprocess
import json

def mix_audio(voice_path, bgm_path, out_path, bgm_volume=0.15, voice_volume=1.0):
    # Input 0: BGM (15.04s)
    # Input 1: Voice (14.90s)
    # With duration=longest and -t 15.000, output is EXACTLY 15.000s
    filter_complex = (
        f"[0:a]volume={bgm_volume}[m];"
        f"[1:a]volume={voice_volume}[v];"
        f"[v][m]amix=inputs=2:duration=longest:dropout_transition=0:normalize=0[mixed];"
        f"[mixed]alimiter=limit=0.95[aout]"
    )
    cmd = [
        "ffmpeg", "-y",
        "-i", bgm_path,
        "-i", voice_path,
        "-filter_complex", filter_complex,
        "-map", "[aout]",
        "-t", "15.000",
        "-b:a", "192k",
        out_path
    ]
    subprocess.run(cmd, check=True, capture_output=True)
    res = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "json", out_path], capture_output=True, text=True)
    dur = float(json.loads(res.stdout)["format"]["duration"])
    print(f"Mixed audio created: {out_path} ({dur:.6f}s)")

if __name__ == "__main__":
    bgm = "D:/source/TWA/ExcelMohamed/projects/mohamed-excel-tcd/public/audio/corporate_bgm.mp3"
    voice_m = "D:/source/TWA/ExcelMohamed/projects/mohamed-excel-tcd/public/audio/voiceover_homme.mp3"
    voice_f = "D:/source/TWA/ExcelMohamed/projects/mohamed-excel-tcd/public/audio/voiceover_femme.mp3"
    
    mix_audio(voice_m, bgm, "D:/source/TWA/ExcelMohamed/projects/mohamed-excel-tcd/public/audio/master_audio_homme.mp3")
    mix_audio(voice_f, bgm, "D:/source/TWA/ExcelMohamed/projects/mohamed-excel-tcd/public/audio/master_audio_femme.mp3")
