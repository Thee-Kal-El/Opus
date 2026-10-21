# Minimal Real-ESRGAN x4 upscaler on CPU, tiled.  [FAST=1 for the compact general-x4v3 model]  python3 thumb/esrgan.py in.png out.png [x0 y0 x1 y1]
import sys, torch, torch.nn as nn, torch.nn.functional as F, numpy as np
from PIL import Image

class RDB(nn.Module):
    def __init__(s, nf=64, gc=32):
        super().__init__()
        s.conv1 = nn.Conv2d(nf, gc, 3, 1, 1); s.conv2 = nn.Conv2d(nf + gc, gc, 3, 1, 1); s.conv3 = nn.Conv2d(nf + 2 * gc, gc, 3, 1, 1)
        s.conv4 = nn.Conv2d(nf + 3 * gc, gc, 3, 1, 1); s.conv5 = nn.Conv2d(nf + 4 * gc, nf, 3, 1, 1); s.l = nn.LeakyReLU(0.2, True)
    def forward(s, x):
        x1 = s.l(s.conv1(x)); x2 = s.l(s.conv2(torch.cat((x, x1), 1))); x3 = s.l(s.conv3(torch.cat((x, x1, x2), 1)))
        x4 = s.l(s.conv4(torch.cat((x, x1, x2, x3), 1))); x5 = s.conv5(torch.cat((x, x1, x2, x3, x4), 1)); return x5 * 0.2 + x
class RRDB(nn.Module):
    def __init__(s, nf, gc=32):
        super().__init__(); s.rdb1 = RDB(nf, gc); s.rdb2 = RDB(nf, gc); s.rdb3 = RDB(nf, gc)
    def forward(s, x): return s.rdb3(s.rdb2(s.rdb1(x))) * 0.2 + x
class RRDBNet(nn.Module):
    def __init__(s, nf=64, nb=23):
        super().__init__()
        s.conv_first = nn.Conv2d(3, nf, 3, 1, 1); s.body = nn.Sequential(*[RRDB(nf) for _ in range(nb)]); s.conv_body = nn.Conv2d(nf, nf, 3, 1, 1)
        s.conv_up1 = nn.Conv2d(nf, nf, 3, 1, 1); s.conv_up2 = nn.Conv2d(nf, nf, 3, 1, 1); s.conv_hr = nn.Conv2d(nf, nf, 3, 1, 1); s.conv_last = nn.Conv2d(nf, 3, 3, 1, 1); s.l = nn.LeakyReLU(0.2, True)
    def forward(s, x):
        f = s.conv_first(x); f = f + s.conv_body(s.body(f))
        f = s.l(s.conv_up1(F.interpolate(f, scale_factor=2, mode='nearest'))); f = s.l(s.conv_up2(F.interpolate(f, scale_factor=2, mode='nearest')))
        return s.conv_last(s.l(s.conv_hr(f)))

class SRVGG(nn.Module):  # realesr-general-x4v3 (compact, ~10x faster)
    def __init__(s, nf=64, nc=32):
        super().__init__(); b = [nn.Conv2d(3, nf, 3, 1, 1), nn.PReLU(nf)]
        for _ in range(nc): b += [nn.Conv2d(nf, nf, 3, 1, 1), nn.PReLU(nf)]
        b += [nn.Conv2d(nf, 48, 3, 1, 1)]; s.body = nn.ModuleList(b); s.up = nn.PixelShuffle(4)
    def forward(s, x):
        o = x
        for m in s.body: o = m(o)
        return s.up(o) + F.interpolate(x, scale_factor=4, mode='nearest')
import os
if os.environ.get('FAST'): net = SRVGG(); sd = torch.load('/root/.sr/realesr-general-x4v3.pth', map_location='cpu')
else: net = RRDBNet(); sd = torch.load('/root/.sr/RealESRGAN_x4plus.pth', map_location='cpu')
net.load_state_dict(sd.get('params_ema', sd.get('params', sd)), strict=True); net.eval()
torch.set_num_threads(4)
im = Image.open(sys.argv[1]).convert('RGB')
if len(sys.argv) > 3: im = im.crop(tuple(int(v) for v in sys.argv[3:7]))
x = torch.from_numpy(np.asarray(im).astype(np.float32) / 255).permute(2, 0, 1)[None]
_, _, h, w = x.shape; T, P = 192, 12; out = torch.zeros(1, 3, h * 4, w * 4)
with torch.no_grad():
    for y in range(0, h, T):
        for xx in range(0, w, T):
            y0, x0 = max(0, y - P), max(0, xx - P); y1, x1 = min(h, y + T + P), min(w, xx + T + P)
            o = net(x[:, :, y0:y1, x0:x1]).clamp(0, 1)
            oy, ox = (y - y0) * 4, (xx - x0) * 4; th, tw = min(T, h - y) * 4, min(T, w - xx) * 4
            out[:, :, y * 4:y * 4 + th, xx * 4:xx * 4 + tw] = o[:, :, oy:oy + th, ox:ox + tw]
Image.fromarray((out[0].permute(1, 2, 0).numpy() * 255).round().astype(np.uint8)).save(sys.argv[2]); print('wrote', sys.argv[2], out.shape)
