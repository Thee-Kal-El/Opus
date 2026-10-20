# SHOT 6 · 27–33 s · the divided city — crane up past a wet rooftop to reveal the undercity sprawl (amber), the clean towers
# of the ones who are leaving (white), riot fires and smoke, and on the horizon MERIDIAN on its pad, pinned by searchlights.
import sys, os, math, random
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
import bpy, blib, mathutils
from blib import *

F0, F1 = 1, 144
sc = setup(world_color=(0.012, 0.014, 0.02), world_strength=1.0)
sc.eevee.volumetric_end = 1500

dark = grime_metal('dark', (0.03, 0.03, 0.032), 0.7, (0.3, 0.7), 4)
roof = mat('roof', (0.02, 0.02, 0.022), 0.4, 0.12)
facs = [window_grid('slum%d' % i, lit=random.choice([(1.0, 0.62, 0.3), (1.0, 0.7, 0.4), (0.4, 1.0, 0.55)]), density=random.uniform(0.18, 0.4), scale=(0.7, 0.5), strength=4, seed=i * 1.7, axes=('X', 'Z')) for i in range(6)]
elite_f = [window_grid('elite%d' % i, lit=(0.85, 0.93, 1.0), wall=(0.08, 0.09, 0.1), density=0.3, scale=(0.9, 0.7), strength=2.5, seed=i * 2.3, axes=('X', 'Z')) for i in range(2)]
white = emission('white', (0.9, 0.95, 1.0), 12)
amber = emission('amber', (1.0, 0.5, 0.15), 30)
red = emission('red', (1.0, 0.05, 0.03), 40)

# ---------- foreground rooftop (camera starts behind its parapet) ----------
box((0, -6, 54.5), (30, 14, 1), roof, name='rooftop')
box((0, 0.6, 55.45), (30, 0.4, 0.9), dark, name='parapet')
for x in (-6, -2.5, 4, 7.5): cyl((x, -3, 56.2), 0.5, 2.4, dark, verts=16, name='vent')
cyl((5.5, -1, 61), 0.06, 12, dark, verts=6, name='antenna'); sphere((5.5, -1, 67.05), 0.12, red, segs=8, name='antenna_led')
box((-9, -2, 56.5), (3, 2.5, 3), dark, name='hut'); box((-9, -0.74, 56.2), (0.9, 0.05, 1.9), emission('door', (1.0, 0.6, 0.3), 3), name='hut_door')

box((0, -6, 27), (30, 14, 55), random.choice([window_grid('own', density=0.25, scale=(0.7, 0.5), strength=4, axes=('X', 'Z'))]), name='our_building')

# ---------- the sprawl ----------
random.seed(39)
for i in range(520):
    x = random.uniform(-260, 260); y = random.uniform(40, 420)
    if abs(x - 70) < 40 and y > 330: continue  # keep the launch complex clear
    h = random.uniform(8, 34) * (1 + y / 500); w = random.uniform(8, 20); d = random.uniform(8, 20)
    b = box((x, y, h / 2 - 2), (w, d, h), random.choice(facs), name='block'); bpy.ops.object.transform_apply(scale=True)
# the elite arcologies: few, tall, clean
for x, y, h in [(-90, 260, 190), (-55, 300, 230), (130, 240, 170), (165, 320, 210)]:
    box((x, y, h / 2), (24, 24, h), random.choice(elite_f), name='arcology'); bpy.ops.object.transform_apply(scale=True)
    box((x, y, h + 6), (8, 8, 12), white, name='crown')
    light('SPOT', (x, y, h + 14), 2.5e5, (0.8, 0.9, 1.0), rot=(math.radians(random.uniform(-14, 14)), math.radians(random.uniform(-10, 10)), 0), size=1, spot=(math.radians(4), 0.3), name='sky_beam')

# ---------- MERIDIAN on the horizon ----------
_before = set(bpy.data.objects)
PX, PY = 70, 400
ship = mat('ship', (0.75, 0.74, 0.7), 0.3, 0.45)
cyl((PX, PY, 50), 5.5, 90, ship, verts=48, name='meridian'); cyl((PX, PY, 102), 5.5, 14, ship, verts=48, r2=0.6, name='nose')
for z in (20, 46, 72): cyl((PX, PY, z), 5.6, 1.2, dark, verts=48, name='band')
for a in (0, 2.1, 4.2): cyl((PX + 7 * math.cos(a), PY + 7 * math.sin(a), 16), 2.2, 30, ship, verts=24, name='booster'); cyl((PX + 7 * math.cos(a), PY + 7 * math.sin(a), 33), 2.2, 4, ship, verts=24, r2=0.3, name='booster_nose')
box((PX - 14, PY, 58), (6, 6, 116), dark, name='gantry')
for z in range(4, 116, 12): box((PX - 9, PY, z), (5, 1.2, 0.6), dark, name='swing_arm'); sphere((PX - 17, PY - 3, z), 0.6, red if z % 24 else amber, segs=8, name='gantry_light')
box((PX, PY, -1), (90, 60, 2), mat('pad', (0.08, 0.08, 0.08), 0, 0.7), name='pad')
for k, (dx, dy) in enumerate([(-38, -25), (38, -25), (-38, 25), (38, 25)]):
    cyl((PX + dx, PY + dy, 15), 0.6, 30, dark, verts=8, name='mast')
    s = light('SPOT', (PX + dx, PY + dy, 30), 4e5, (1.0, 0.9, 0.75), size=0.5, spot=(math.radians(75), 0.4), name='pad_flood'); look_at(s, (PX, PY, 45 + k * 6))
volume_box('pad_haze', (PX, PY, 60), (200, 160, 140), density=0.006, color=(0.8, 0.8, 0.85), noise_scale=1.6, animate_w=(0, 0.4, F0, F1))
# scale the whole launch complex up 1.5x and lift it onto a raised platform so it clears the skyline
for o in set(bpy.data.objects) - _before:
    o.location = mathutils.Vector((PX, PY, 0)) + (o.location - mathutils.Vector((PX, PY, 0))) * 1.5 + mathutils.Vector((0, 0, 28)); o.scale *= 1.5
for o in bpy.data.objects:
    if o.name.startswith('pad_flood'): look_at(o, (PX, PY, 115))
box((PX, PY, 13), (150, 100, 30), window_grid('platform', density=0.15, scale=(0.5, 0.4), strength=3, axes=('X', 'Z')), name='platform')
# perimeter searchlights sweeping the sky
for k, dx in enumerate((-60, 60)):
    s = light('SPOT', (PX + dx, PY - 40, 4), 4e5, (0.9, 0.95, 1.0), size=0.5, spot=(math.radians(3), 0.2), name='search')
    for f in range(F0, F1 + 1, 12):
        look_at(s, (PX + dx * 0.4 + 60 * math.sin(f * 0.035 + k * 2), PY + 30, 200)); s.keyframe_insert('rotation_euler', frame=f)

# ---------- riots: fires + smoke in the sprawl ----------
for k, (fx, fy) in enumerate([(-40, 140), (25, 200), (-120, 230), (95, 170)]):
    sphere((fx, fy, 3), 2.5 + k * 0.4, amber, segs=12, name='fire')
    fl = light('POINT', (fx, fy, 12), 1.5e5, (1.0, 0.45, 0.12), size=3, name='fire_light')
    for f in range(F0, F1 + 1, 3): fl.data.energy = 1.5e5 * random.uniform(0.55, 1.2); fl.data.keyframe_insert('energy', frame=f)
    volume_box('smoke%d' % k, (fx + 6, fy, 30), (22, 22, 60), density=0.35, color=(0.3, 0.26, 0.22), noise_scale=1.8, animate_w=(k, k + 1.2, F0, F1))
volume_box('city_haze', (0, 220, 40), (600, 420, 90), density=0.003, color=(0.8, 0.7, 0.6))
volume_box('sky_haze', (0, 300, 280), (900, 700, 380), density=0.0012, color=(0.8, 0.85, 0.9))

# ---------- camera: crane up over the parapet ----------
cam = camera((0, -4, 56.3), (20, 300, 30), lens=30)
key(cam, 'location', F0, (-1, -4.5, 57.0)); key(cam, 'location', F1, (2, -2, 62.5))
cam.location = (-1, -4.5, 57.0); look_at(cam, (25, 300, 50)); key(cam, 'rotation_euler', F0); cam.location = (2, -2, 62.5); look_at(cam, (60, 380, 85)); key(cam, 'rotation_euler', F1); ease_all(cam)
render('city', F0, F1)
