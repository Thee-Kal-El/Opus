#!/usr/bin/env python3
import os
import subprocess
import sys

from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H = 1080, 1920
FPS = 30
BG = (6, 9, 7)
GREEN = (46, 235, 125)
GREEN_DIM = (28, 105, 62)
GREEN_DARK = (14, 40, 24)
WHITE = (242, 242, 238)
GRAY = (125, 135, 128)

FD = "/usr/share/fonts/truetype/dejavu/"
F_BOLD = FD + "DejaVuSans-Bold.ttf"
F_COND = FD + "DejaVuSansCondensed-Bold.ttf"
F_MONO = FD + "DejaVuSansMono.ttf"
F_MONO_B = FD + "DejaVuSansMono-Bold.ttf"

ROOT = "/home/user/Opus/arc-video"
SRC = f"{ROOT}/source_images"
OUT = f"{ROOT}/edit/segments"

# Social UI (captions, buttons) covers roughly the bottom 380px and the top 120px;
# everything that must be read lives between SAFE_TOP and SAFE_BOTTOM.
SAFE_TOP, SAFE_BOTTOM = 190, 1540
FADE_FRAMES = 8

_font_cache = {}


def font(path, size):
    key = (path, size)
    if key not in _font_cache:
        _font_cache[key] = ImageFont.truetype(path, size)
    return _font_cache[key]


def ease_out(t):
    t = max(0.0, min(1.0, t))
    return 1 - (1 - t) ** 3


def ease_in_out(t):
    t = max(0.0, min(1.0, t))
    return 4 * t ** 3 if t < 0.5 else 1 - (-2 * t + 2) ** 3 / 2


def mix(col, a, base=BG):
    a = max(0.0, min(1.0, a))
    return tuple(int(c * a + b * (1 - a)) for c, b in zip(col, base))


def tw(draw, s, f):
    b = draw.textbbox((0, 0), s, font=f)
    return b[2] - b[0]


def fit_font(draw, s, path, size, max_w):
    while size > 12 and tw(draw, s, font(path, size)) > max_w:
        size -= 2
    return font(path, size)


def center(draw, y, s, f, fill, cx=W // 2):
    draw.text((cx - tw(draw, s, f) / 2, y), s, font=f, fill=fill)


def build_background():
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    for x in range(0, W, 90):
        d.line([(x, 0), (x, H)], fill=(14, 24, 17), width=1)
    for y in range(0, H, 90):
        d.line([(0, y), (W, y)], fill=(14, 24, 17), width=1)
    for y in range(0, H, 4):
        d.line([(0, y), (W, y)], fill=(4, 6, 5), width=1)

    vignette = Image.new("L", (W, H), 0)
    vd = ImageDraw.Draw(vignette)
    vd.ellipse([-W * 0.35, -H * 0.15, W * 1.35, H * 1.15], fill=255)
    vignette = vignette.filter(ImageFilter.GaussianBlur(160))
    dark = Image.new("RGB", (W, H), (0, 0, 0))
    img = Image.composite(img, dark, vignette)

    d = ImageDraw.Draw(img)
    d.text((60, 70), "FINALITY", font=font(F_BOLD, 40), fill=WHITE)
    right = "ARC NET // MAINNET"
    f = font(F_MONO, 22)
    d.text((W - 60 - tw(d, right, f), 84), right, font=f, fill=GREEN)
    d.line([(60, 140), (W - 60, 140)], fill=GREEN, width=3)

    d.line([(60, 1780), (W - 60, 1780)], fill=GREEN_DIM, width=1)
    foot = "THE MAGAZINE OF ARC · BUILT ON FINALITY"
    f = font(F_MONO, 20)
    center(d, 1800, foot, f, GREEN_DIM)
    return img


BACKGROUND = None


def canvas():
    return BACKGROUND.copy()


class Encoder:
    def __init__(self, path):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        self.proc = subprocess.Popen(
            ["ffmpeg", "-y", "-loglevel", "error",
             "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS),
             "-i", "-",
             "-c:v", "libx264", "-preset", "medium", "-crf", "16",
             "-pix_fmt", "yuv420p", "-r", str(FPS), path],
            stdin=subprocess.PIPE,
        )

    def write(self, img):
        self.proc.stdin.write(img.tobytes())

    def close(self):
        self.proc.stdin.close()
        if self.proc.wait() != 0:
            raise RuntimeError("ffmpeg failed")


def run_segment(name, seconds, render):
    n = int(seconds * FPS)
    path = f"{OUT}/{name}.mp4"
    enc = Encoder(path)
    black = Image.new("RGB", (W, H), (0, 0, 0))
    for i in range(n):
        img = render(i, n)
        edge = min(i, n - 1 - i)
        if edge < FADE_FRAMES:
            img = Image.blend(black, img, ease_in_out((edge + 1) / (FADE_FRAMES + 1)))
        enc.write(img)
    enc.close()
    print(f"{name}: {n} frames -> {path}")


def at(i, start_s, dur_s):
    return ease_out((i - start_s * FPS) / (dur_s * FPS))


# ---------- 1. HOOK: 5s ----------
def hook(i, n):
    img = canvas()
    d = ImageDraw.Draw(img)

    a = at(i, 0.0, 0.7)
    f_arc = font(F_BOLD, 330)
    y = 520 + (1 - a) * 80
    if i < 10:
        jitter = (6 - i % 3 * 6)
        center(d, y, "ARC", f_arc, mix(GREEN, a * 0.8), cx=W // 2 + jitter)
    center(d, y, "ARC", f_arc, mix(WHITE, a))

    b = at(i, 0.9, 0.6)
    if b > 0:
        f_live = font(F_BOLD, 130)
        center(d, 900 + (1 - b) * 40, "IS LIVE.", f_live, mix(GREEN, b))

    c = at(i, 1.8, 0.6)
    if c > 0:
        d.line([(180, 1110), (180 + 720 * c, 1110)], fill=mix(GREEN_DIM, c), width=2)
        center(d, 1140, "CIRCLE'S LAYER 1 BLOCKCHAIN", font(F_MONO_B, 34), mix(WHITE, c))
        center(d, 1195, "MAINNET · 2026-09-16 · NEW YORK", font(F_MONO, 30), mix(GRAY, c))
    return img


# ---------- 2. MAINNET: 9s ----------
FACTS = [
    ("MAINNET LIVE", "SEPT 16, 2026 · NEW YORK"),
    ("WHAT IT IS", "AN ECONOMIC OS FOR THE INTERNET"),
    ("GAS", "PAID IN USDC, NOT A VOLATILE TOKEN"),
    ("DAY ONE", "100+ APPS · AAVE · MORPHO · UNISWAP"),
]


def mainnet(i, n):
    img = canvas()
    d = ImageDraw.Draw(img)

    h = at(i, 0.0, 0.6)
    center(d, 230, "ARC NET", font(F_BOLD, 110), mix(WHITE, h))
    center(d, 365, "GOES LIVE", font(F_BOLD, 64), mix(GREEN, h))

    box_x0, box_x1 = 80, W - 80
    for k, (label, value) in enumerate(FACTS):
        a = at(i, 0.8 + k * 1.5, 0.6)
        if a <= 0:
            continue
        slide = int((1 - a) * 70)
        y0 = 520 + k * 245
        d.rectangle([box_x0 + slide, y0, box_x1 + slide, y0 + 200], outline=mix(GREEN_DIM, a), width=2)
        d.rectangle([box_x0 + slide, y0, box_x0 + slide + 90, y0 + 8], fill=mix(GREEN, a))
        d.text((box_x0 + 40 + slide, y0 + 40), label, font=font(F_MONO_B, 30), fill=mix(GREEN, a))
        f = fit_font(d, value, F_MONO_B, 42, box_x1 - box_x0 - 80)
        d.text((box_x0 + 40 + slide, y0 + 105), value, font=f, fill=mix(WHITE, a))
    return img


# ---------- 3. FINALITY: 9s ----------
def finality(i, n):
    img = canvas()
    d = ImageDraw.Draw(img)

    h = at(i, 0.0, 0.5)
    center(d, 240, "FINALITY TEST", font(F_MONO_B, 40), mix(GREEN, h))

    count = ease_out((i - 0.3 * FPS) / (1.6 * FPS))
    val = int(round(count * 350))
    f_num = font(F_BOLD, 300)
    f_ms = font(F_BOLD, 110)
    num = str(val)
    num_w = tw(d, num, f_num)
    ms_w = tw(d, "ms", f_ms)
    x0 = W / 2 - (num_w + 20 + ms_w) / 2
    a = at(i, 0.2, 0.3)
    d.text((x0, 360), num, font=f_num, fill=mix(GREEN, a))
    d.text((x0 + num_w + 20, 535), "ms", font=f_ms, fill=mix(GREEN, a))

    b = at(i, 2.1, 0.6)
    if b > 0:
        center(d, 760, "SUB-SECOND, DETERMINISTIC", font(F_BOLD, 52), mix(WHITE, b))
        center(d, 830, "FINALITY", font(F_BOLD, 52), mix(WHITE, b))

    # A short chain of blocks commits one by one and the last one stamps FINAL.
    blocks = 5
    bw, gap = 150, 32
    total = blocks * bw + (blocks - 1) * gap
    bx0 = (W - total) / 2
    by0 = 1000
    for k in range(blocks):
        c = at(i, 3.0 + k * 0.45, 0.35)
        if c <= 0:
            continue
        x = bx0 + k * (bw + gap)
        last = k == blocks - 1
        fill = mix(GREEN, c) if last else mix(GREEN_DARK, c)
        d.rectangle([x, by0, x + bw, by0 + bw], fill=fill, outline=mix(GREEN, c), width=3)
        label = "FINAL" if last else f"#{k + 1:04d}"
        f = font(F_MONO_B, 28 if last else 24)
        col = mix((0, 0, 0), c, base=fill) if last else mix(GREEN, c)
        d.text((x + bw / 2 - tw(d, label, f) / 2, by0 + bw / 2 - 16), label, font=f, fill=col)
        if k < blocks - 1:
            d.line([(x + bw, by0 + bw / 2), (x + bw + gap, by0 + bw / 2)], fill=mix(GREEN, c), width=3)

    e = at(i, 5.6, 0.6)
    if e > 0:
        center(d, 1260, "NO REORGS. NO ROLLBACKS.", font(F_MONO_B, 38), mix(WHITE, e))
        center(d, 1320, "NO WAITING FOR CONFIRMATIONS.", font(F_MONO_B, 38), mix(WHITE, e))
        center(d, 1420, "MALACHITE BFT CONSENSUS", font(F_MONO, 28), mix(GRAY, e))
    return img


# ---------- 4. THE ELEVEN: 18s ----------
VALIDATORS = [
    ("BLACKROCK", "TOKENIZED FUNDS"),
    ("ICE", "NYSE PARENT"),
    ("STANDARD\nCHARTERED", "SETTLEMENT"),
    ("SBI GROUP", "USDC IN JAPAN"),
    ("DTCC", "TOKENIZATION"),
    ("GALAXY", "DEFI LIQUIDITY"),
    ("MONEYGRAM", "STABLECOIN PAY"),
    ("VISA", "ONCHAIN PAY"),
    ("MASTERCARD", "PAY INTEROP"),
    ("SUMITOMO\nCORP.", "NET SECURITY"),
    ("GLOBAL\nPAYMENTS", "MERCHANTS"),
]


def eleven(i, n):
    img = canvas()
    d = ImageDraw.Draw(img)

    h = at(i, 0.0, 0.6)
    center(d, 200, "THE ELEVEN", font(F_BOLD, 120), mix(WHITE, h))
    center(d, 345, "FOUNDING VALIDATORS OF ARC", font(F_MONO_B, 32), mix(GREEN, h))

    cols = 3
    mx, gap = 60, 18
    cw = (W - 2 * mx - (cols - 1) * gap) // cols
    ch = 210
    gy0 = 430
    reveal_from, reveal_step = 1.0, 0.85

    cells = VALIDATORS + [("CIRCLE", "NETWORK OPERATOR")]
    for k, (name, role) in enumerate(cells):
        a = at(i, reveal_from + k * reveal_step, 0.45)
        if a <= 0:
            continue
        r, c = divmod(k, cols)
        x = mx + c * (cw + gap)
        y = gy0 + r * (ch + gap)
        op = k == len(cells) - 1
        lift = int((1 - a) * 30)
        y += lift
        if op:
            d.rectangle([x, y, x + cw, y + ch], fill=mix(GREEN, a), outline=mix(GREEN, a), width=2)
            txt, sub, idx_col = (0, 0, 0), (0, 0, 0), (0, 0, 0)
            txt = mix(txt, a, base=mix(GREEN, a))
            sub = txt
            idx_col = txt
            idx = "OP"
        else:
            d.rectangle([x, y, x + cw, y + ch], fill=mix(GREEN_DARK, a * 0.6), outline=mix(GREEN_DIM, a), width=2)
            txt, sub, idx_col = mix(WHITE, a), mix(GRAY, a), mix(GREEN, a)
            idx = f"{k + 1:02d}"
        d.text((x + 16, y + 12), idx, font=font(F_MONO_B, 22), fill=idx_col)
        lines = name.split("\n")
        f = font(F_BOLD, 34)
        for ln in lines:
            f = fit_font(d, ln, F_BOLD, 34, cw - 30) if tw(d, ln, f) > cw - 30 else f
        ly = y + 70 - (len(lines) - 1) * 22
        for ln in lines:
            d.text((x + cw / 2 - tw(d, ln, f) / 2, ly), ln, font=f, fill=txt)
            ly += 42
        fr = fit_font(d, role, F_MONO, 20, cw - 24)
        d.text((x + cw / 2 - tw(d, role, fr) / 2, y + ch - 40), role, font=fr, fill=sub)

    done = reveal_from + len(cells) * reveal_step + 0.4
    e = at(i, done, 0.6)
    if e > 0:
        y = gy0 + 4 * (ch + gap) + 20
        center(d, y, "11 INSTITUTIONS · >2/3 TO COMMIT A BLOCK", font(F_MONO_B, 30), mix(GREEN, e))
    return img


# ---------- 5. SEEN ON X: 14s ----------
SHOTS = [
    ("11.jpg", 240, 1420, "@arc · MAINNET IS LIVE"),
    ("17.jpg", 240, 1270, "@arc · ONE WEEK IN"),
    ("18.jpg", 240, 1585, "@arc · AGENTIC PAYMENTS"),
    ("14.jpg", 240, 1690, "@arc · CENTRIFUGE ON ARC"),
]
_shot_cache = {}


def load_shot(k):
    if k not in _shot_cache:
        fname, y0, y1, _ = SHOTS[k]
        im = Image.open(f"{SRC}/{fname}").convert("RGB").crop((0, y0, 923, y1))
        max_w, max_h = W - 140, SAFE_BOTTOM - 420
        s = min(max_w / im.width, max_h / im.height)
        _shot_cache[k] = im.resize((int(im.width * s), int(im.height * s)), Image.LANCZOS)
    return _shot_cache[k]


def seen_on_x(i, n):
    img = canvas()
    d = ImageDraw.Draw(img)

    h = at(i, 0.0, 0.5)
    center(d, 200, "SEEN ON X", font(F_BOLD, 96), mix(WHITE, h))

    per = n // len(SHOTS)
    k = min(i // per, len(SHOTS) - 1)
    li = i - k * per
    t = li / per
    shot = load_shot(k)

    zoom = 1.0 + 0.05 * ease_in_out(t)
    sw, sh = int(shot.width * zoom), int(shot.height * zoom)
    zoomed = shot.resize((sw, sh), Image.BILINEAR)
    box_w, box_h = shot.width, shot.height
    cx, cy = (sw - box_w) // 2, (sh - box_h) // 2
    framed = zoomed.crop((cx, cy, cx + box_w, cy + box_h))

    a = ease_out(li / 8) if li < 8 else 1.0
    if per - li < 8:
        a = min(a, ease_out((per - li) / 8))
    slide = int((1 - a) * 50)
    px = (W - box_w) // 2
    py = 345 + slide
    framed = Image.blend(Image.new("RGB", framed.size, BG), framed, a)
    img.paste(framed, (px, py))
    d.rectangle([px - 6, py - 6, px + box_w + 6, py + box_h + 6], outline=mix(GREEN, a), width=3)

    cap = SHOTS[k][3]
    center(d, py + box_h + 30, cap, font(F_MONO_B, 30), mix(GREEN, a))
    dots = "  ".join("●" if j == k else "○" for j in range(len(SHOTS)))
    center(d, 1690, dots, font(F_MONO, 26), GREEN_DIM)
    return img


# ---------- 6. OUTRO: 5s ----------
def outro(i, n):
    img = canvas()
    d = ImageDraw.Draw(img)
    a = at(i, 0.0, 0.5)
    center(d, 600, "FINAL.", font(F_BOLD, 150), mix(GREEN, a))
    b = at(i, 0.5, 0.5)
    center(d, 800, "IRREVERSIBLE.", fit_font(d, "IRREVERSIBLE.", F_BOLD, 120, W - 160), mix(GREEN, b))
    c = at(i, 1.3, 0.6)
    if c > 0:
        d.line([(200, 1010), (W - 200, 1010)], fill=mix(GREEN_DIM, c), width=2)
        center(d, 1050, "ARC MAINNET · LIVE SINCE 2026-09-16", font(F_MONO_B, 32), mix(WHITE, c))
        center(d, 1130, "FOLLOW @FINALITYmag", font(F_MONO_B, 36), mix(GREEN, c))
    return img


SEGMENTS = [
    ("01_hook", 5, hook),
    ("02_mainnet", 9, mainnet),
    ("03_finality", 9, finality),
    ("04_eleven", 18, eleven),
    ("05_seen_on_x", 14, seen_on_x),
    ("06_outro", 5, outro),
]


def still(name, t):
    seg = {s[0]: s for s in SEGMENTS}[name]
    n = int(seg[1] * FPS)
    i = min(int(t * FPS), n - 1)
    os.makedirs(f"{ROOT}/edit/verify", exist_ok=True)
    p = f"{ROOT}/edit/verify/{name}_{t:.1f}s.png"
    seg[2](i, n).save(p)
    print(p)


if __name__ == "__main__":
    BACKGROUND = build_background()
    args = sys.argv[1:]
    if args and args[0] == "still":
        still(args[1], float(args[2]))
    else:
        wanted = set(args)
        for name, secs, fn in SEGMENTS:
            if not wanted or name in wanted:
                run_segment(name, secs, fn)
