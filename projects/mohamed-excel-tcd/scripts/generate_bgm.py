import numpy as np
from scipy.io import wavfile
import subprocess
import os

def generate_corporate_bgm(output_path, duration_sec=15.0, sample_rate=44100):
    total_samples = int(duration_sec * sample_rate)
    t = np.linspace(0, duration_sec, total_samples, endpoint=False)
    
    bpm = 112.0
    beat_dur = 60.0 / bpm
    bar_dur = beat_dur * 4.0 # ~2.14s per bar
    
    # Left and Right stereo channels
    left = np.zeros(total_samples, dtype=np.float32)
    right = np.zeros(total_samples, dtype=np.float32)
    
    # Chord progression: Fmaj7 -> Cmaj -> Dm7 -> Bbmaj7 (very clean, uplifting, corporate)
    # Frequencies in Hz:
    # Fmaj7: F3(174.6), A3(220.0), C4(261.6), E4(329.6)
    # Cmaj:  C3(130.8), G3(196.0), C4(261.6), E4(329.6)
    # Dm7:   D3(146.8), A3(220.0), C4(261.6), F4(349.2)
    # Bbmaj7:Bb2(116.5), F3(174.6), A3(220.0), D4(293.7)
    
    chords = [
        ([174.6, 220.0, 261.6, 329.6], 174.6 / 2), # Fmaj7, bass F2
        ([130.8, 196.0, 261.6, 329.6], 130.8 / 2), # Cmaj, bass C2
        ([146.8, 220.0, 261.6, 349.2], 146.8 / 2), # Dm7, bass D2
        ([116.5, 174.6, 220.0, 293.7], 116.5 / 2), # Bbmaj7, bass Bb1
        ([174.6, 220.0, 261.6, 329.6], 174.6 / 2), # Fmaj7
        ([130.8, 196.0, 261.6, 329.6], 130.8 / 2), # Cmaj
        ([146.8, 220.0, 261.6, 349.2], 146.8 / 2), # Dm7
    ]
    
    # 1. Warm Rhodes / Electric Piano chords with soft chorus & tremolo
    for i, (chord_notes, bass_freq) in enumerate(chords):
        chord_start = i * bar_dur
        chord_end = min((i + 1) * bar_dur, duration_sec)
        if chord_start >= duration_sec:
            break
        
        idx_start = int(chord_start * sample_rate)
        idx_end = int(chord_end * sample_rate)
        seg_len = idx_end - idx_start
        t_seg = t[idx_start:idx_end] - chord_start
        
        # Envelope: gentle attack (40ms), long warm sustain, soft release
        env = np.ones(seg_len, dtype=np.float32)
        att_len = int(0.04 * sample_rate)
        rel_len = int(0.25 * sample_rate)
        if seg_len > att_len:
            env[:att_len] = np.linspace(0, 1, att_len)
        if seg_len > rel_len:
            env[-rel_len:] = np.linspace(1, 0, rel_len)
            
        # Add chord tones with bell-like Rhodes harmonics
        chord_signal_l = np.zeros(seg_len, dtype=np.float32)
        chord_signal_r = np.zeros(seg_len, dtype=np.float32)
        
        for freq in chord_notes:
            # Fundamental + soft 2nd/3rd harmonics
            tone = (np.sin(2 * np.pi * freq * t_seg) * 0.6 +
                    np.sin(2 * np.pi * freq * 2 * t_seg) * 0.25 +
                    np.sin(2 * np.pi * freq * 3 * t_seg) * 0.1)
            # Stereo chorus detune (slightly offset phase & freq)
            tone_l = tone * (1.0 + 0.15 * np.sin(2 * np.pi * 1.5 * t_seg))
            tone_r = tone * (1.0 + 0.15 * np.cos(2 * np.pi * 1.5 * t_seg))
            chord_signal_l += tone_l * 0.08
            chord_signal_r += tone_r * 0.08
            
        # Bass pulse (warm sine sub with soft saturation)
        bass = np.sin(2 * np.pi * bass_freq * t_seg) * 0.18
        bass_env = np.exp(-t_seg * 1.5) # Plucked acoustic bass decay
        bass_signal = np.tanh(bass * bass_env * 1.2) * 0.16
        
        left[idx_start:idx_end] += (chord_signal_l + bass_signal) * env
        right[idx_start:idx_end] += (chord_signal_r + bass_signal) * env
        
    # 2. Add subtle modern percussion groove (tempo 112 BPM): Shaker on 16th notes, Soft Snare/Snap on beats 2 & 4
    num_beats = int(duration_sec / beat_dur)
    for b in range(num_beats):
        b_time = b * beat_dur
        # Shaker on 16th notes (4 hits per beat)
        for sub in range(4):
            shk_time = b_time + sub * (beat_dur / 4.0)
            if shk_time < duration_sec:
                shk_idx = int(shk_time * sample_rate)
                shk_len = int(0.03 * sample_rate)
                if shk_idx + shk_len < total_samples:
                    # White noise filtered burst
                    noise = (np.random.rand(shk_len) * 2 - 1).astype(np.float32)
                    shk_env = np.linspace(1, 0, shk_len) ** 2
                    shk_vol = 0.025 if sub == 0 else 0.015
                    left[shk_idx:shk_idx+shk_len] += noise * shk_env * shk_vol
                    right[shk_idx:shk_idx+shk_len] += noise * shk_env * shk_vol
                    
        # Soft rim/snap on beats 2 and 4
        if b % 2 == 1:
            snap_idx = int(b_time * sample_rate)
            snap_len = int(0.06 * sample_rate)
            if snap_idx + snap_len < total_samples:
                snap_t = np.linspace(0, 0.06, snap_len)
                snap_tone = np.sin(2 * np.pi * 800 * snap_t) * np.exp(-snap_t * 60)
                snap_noise = (np.random.rand(snap_len) * 2 - 1) * np.exp(-snap_t * 40)
                snap_hit = (snap_tone * 0.04 + snap_noise * 0.03).astype(np.float32)
                left[snap_idx:snap_idx+snap_len] += snap_hit
                right[snap_idx:snap_idx+snap_len] += snap_hit
                
    # 3. Overall Master Fades: 0.5s fade-in, 1.2s fade-out at end
    fade_in_len = int(0.5 * sample_rate)
    fade_out_len = int(1.2 * sample_rate)
    master_env = np.ones(total_samples, dtype=np.float32)
    master_env[:fade_in_len] = np.linspace(0, 1, fade_in_len)
    master_env[-fade_out_len:] = np.linspace(1, 0, fade_out_len)
    
    left = np.clip(left * master_env, -0.95, 0.95)
    right = np.clip(right * master_env, -0.95, 0.95)
    
    stereo = np.column_stack((left, right))
    wav_path = output_path.replace(".mp3", ".wav")
    wavfile.write(wav_path, sample_rate, (stereo * 32767).astype(np.int16))
    
    # Convert to MP3 with ffmpeg
    subprocess.run(["ffmpeg", "-y", "-i", wav_path, "-b:a", "192k", output_path], check=True, capture_output=True)
    if os.path.exists(wav_path):
        os.remove(wav_path)
    print(f"Corporate BGM generated successfully: {output_path}")

if __name__ == "__main__":
    out_file = "D:/source/TWA/ExcelMohamed/projects/mohamed-excel-tcd/public/audio/corporate_bgm.mp3"
    generate_corporate_bgm(out_file)
