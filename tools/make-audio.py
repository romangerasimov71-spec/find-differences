#!/usr/bin/env python3
"""Сборка звуков игры из скачанных CC0-исходников (см. src/assets/CREDITS.txt).

  python3 tools/make-audio.py <папка-с-исходниками>

В папке должны лежать распакованные архивы и музыка:
  iface/Audio/*.ogg          — kenney_interfaceSounds.zip (Kenney, Interface Sounds)
  jingle/OGG/jingles_*/*.ogg — jingleSounds_Kenney.zip   (Kenney, Music Jingles)
  music/winter-wind.mp3      — Winter Wind (wipics), opengameart.org/content/winter-wind

Эффекты: обрезка тишины в начале, выравнивание пика, короткое затухание в конце, ogg + mp3.
Музыка: бесшовная петля. В исходнике музыка идёт ровно 80,0 с (28 тактов при 84 уд/мин), дальше —
хвост последней ноты и тишина. Петля = первые 80 с, хвост после 80 с подмешан в начало (так звучал бы
повтор без паузы). Затем петля повёрнута на 4 такта, чтобы файл начинался в плотном месте: так
audio.js надёжно находит начало петли даже там, где декодер mp3 оставляет задержку кодировщика.
Сжатие ~96 кбит/с.
"""
import os, subprocess, sys
import numpy as np

SRC = sys.argv[1]
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src', 'assets')
SR = 44100

# имя в игре: (исходник, пик в дБFS)
SFX = {
    'click': ('iface/Audio/click_002.ogg', -6.0),
    'found': ('iface/Audio/glass_001.ogg', -2.0),
    'miss':  ('iface/Audio/bong_001.ogg', -1.5),
    'win':   ('jingle/OGG/jingles_STEEL/jingles_STEEL10.ogg', -2.5),
    'star':  ('iface/Audio/pluck_002.ogg', -5.0),
    'gift':  ('jingle/OGG/jingles_STEEL/jingles_STEEL02.ogg', -3.0),
}
MUSIC_SRC = 'music/winter-wind.mp3'
LOOP_SEC = 80.0      # длина петли (28 тактов × 4 доли × 60/84 с)
ROTATE_SEC = 4 * 4 * 60 / 84  # поворот петли на 4 такта


def decode(path, ch):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', str(ch), '-ar', str(SR), '-f', 'f32le', '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, ch).copy()


def channels(path):
    out = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'a:0', '-show_entries', 'stream=channels',
                          '-of', 'csv=p=0', path], capture_output=True, text=True, check=True).stdout
    return int(out.strip())


def encode(x, base, ogg_args, mp3_args):
    ch = x.shape[1]
    pcm = np.clip(x, -1, 1).astype(np.float32).tobytes()
    for ext, args in (('ogg', ['-c:a', 'libvorbis'] + ogg_args), ('mp3', ['-c:a', 'libmp3lame'] + mp3_args)):
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', str(ch), '-i', '-',
                        '-map_metadata', '-1'] + args + [base + '.' + ext], input=pcm, check=True)


def sfx():
    os.makedirs(os.path.join(OUT, 'sfx'), exist_ok=True)
    for name, (rel, peak_db) in SFX.items():
        p = os.path.join(SRC, rel)
        x = decode(p, channels(p))
        a = np.abs(x).max(1)
        start = max(0, int(np.argmax(a > 10 ** (-50 / 20))) - int(0.002 * SR))
        end = len(a) - int(np.argmax(a[::-1] > 10 ** (-60 / 20)))
        x = x[start:end]
        x *= 10 ** (peak_db / 20) / np.abs(x).max()
        f = min(len(x), int(0.006 * SR))
        x[-f:] *= np.linspace(1, 0, f)[:, None]
        encode(x, os.path.join(OUT, 'sfx', name), ['-q:a', '4'], ['-b:a', '128k'])
        print(f'sfx/{name}: {len(x) / SR:.2f} c, {x.shape[1]} кан., пик {peak_db} дБ')


def music():
    os.makedirs(os.path.join(OUT, 'music'), exist_ok=True)
    x = decode(os.path.join(SRC, MUSIC_SRC), 2)
    n = int(round(LOOP_SEC * SR))
    loop = x[:n].copy()
    tail = x[n:]
    loop[:len(tail)] += tail                       # хвост после конца петли — в её начало
    loop = np.roll(loop, -int(round(ROTATE_SEC * SR)), axis=0)
    loop *= 10 ** (-1.0 / 20) / np.abs(loop).max()   # пик −1 дБFS
    encode(loop, os.path.join(OUT, 'music', 'winter'), ['-b:a', '96k'], ['-b:a', '96k'])
    jump = np.abs(loop[0] - loop[-1]).max()
    print(f'music/winter: петля {len(loop) / SR:.3f} c, скачок на стыке {jump:.4f}, первый отсчёт {np.abs(loop[0]).max():.3f}')


if __name__ == '__main__':
    sfx()
    music()
