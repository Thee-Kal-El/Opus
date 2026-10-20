# SHOT 5 · 21–27 s · the ration queue — a wet undercity street under sodium lamps, a line of hooded people at a shuttered depot,
# steam from the grates, and far off through the haze the clean white tower of the ones who get to leave.
import sys, os, math, random
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
import bpy, blib, mathutils
from blib import *

F0, F1 = 1, 144
sc = setup(world_color=(0.01, 0.012, 0.016), world_strength=1.0)
sc.eevee.volumetric_tile_size = '8'

# ---------- materials ----------
wet = mat('wet_ground', (0.02, 0.02, 0.022), 0.3, 0.08)
nt = wet.node_tree; b = nt.nodes['Principled BSDF']; nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 1.6; nz.inputs['Detail'].default_value = 6
mr = nt.nodes.new('ShaderNodeMapRange'); mr.inputs['From Min'].default_value = 0.45; mr.inputs['From Max'].default_value = 0.6; mr.inputs['To Min'].default_value = 0.04; mr.inputs['To Max'].default_value = 0.55
nt.links.new(nz.outputs['Fac'], mr.inputs['Value']); nt.links.new(mr.outputs['Result'], b.inputs['Roughness'])
hull = grime_metal('wall', (0.07, 0.068, 0.065), 0.6, (0.3, 0.8), 3)
dark = grime_metal('dark', (0.025, 0.025, 0.028), 0.8, (0.35, 0.7), 8)
cloth = [mat('cloth%d' % i, c, 0.0, 0.85) for i, c in enumerate([(0.03, 0.03, 0.032), (0.05, 0.04, 0.03), (0.025, 0.035, 0.03), (0.06, 0.055, 0.05)])]
skin = mat('skin', (0.12, 0.08, 0.06), 0.0, 0.6)
sodium = emission('sodium', (1.0, 0.55, 0.18), 40)
crt = emission('crt', (0.3, 1.0, 0.45), 6)
red = emission('red', (1.0, 0.08, 0.04), 30)
elite = emission('elite', (0.85, 0.92, 1.0), 9)

# ---------- street ----------
box((0, 20, -0.05), (14, 70, 0.1), wet, name='ground')
box((-2.9, 20, 0.04), (0.6, 70, 0.08), hull, name='curbL')
for sgn in (-1, 1):
    for k in range(7):
        y = -4 + k * 8.5; h = random.uniform(9, 16)
        bl = box((sgn * (5.2 + random.uniform(0, 0.6)), y, h / 2), (3, 8.2, h), window_grid('fac%d%d' % (sgn, k), density=random.uniform(0.12, 0.3), seed=k * 3.1 + sgn, strength=3.5, scale=(0.8, 0.5), axes=('Y', 'Z'), lit=(1.0, 0.7, 0.4) if random.random() < 0.75 else (0.4, 1.0, 0.6)), name='bldg'); bpy.ops.object.transform_apply(scale=True)
        # pipes + ledges on the street-facing walls
        cyl((sgn * 3.75, y, random.uniform(3, 6)), 0.12, 8.2, dark, rot=(math.pi / 2, 0, 0), verts=12, name='pipe')
        box((sgn * 3.8, y, random.uniform(2.6, 3.2)), (0.5, 8.2, 0.1), dark, name='ledge')
# overhead cables / cross pipes
for k in range(9):
    y = k * 6 - 2; cyl((0, y, 6.5 + random.uniform(-0.5, 0.8)), 0.06, 10, dark, rot=(0, math.pi / 2, 0), verts=8, name='cable')

# depot: shutter + CRT sign, on the left wall
DY = 8.5
box((-3.6, DY, 1.4), (0.2, 3.0, 2.8), grime_metal('shutter', (0.12, 0.1, 0.08), 0.7, (0.4, 0.8), 30), name='shutter')
for z in [i * 0.18 + 0.1 for i in range(15)]: box((-3.48, DY, z), (0.04, 3.0, 0.03), dark, name='slat')
box((-3.5, DY, 3.25), (0.3, 3.2, 0.7), dark, name='signbox')
txt = text_mesh('RATION DEPOT 07', (-3.33, DY, 3.17), 0.32, crt, rot=(math.pi / 2, 0, math.pi / 2), font=MONO)
light('AREA', (-2.9, DY, 3.0), 60, (0.3, 1.0, 0.45), rot=(0, math.radians(-90), 0), size=2.5, name='sign_spill')
for k in range(3): sphere((-3.38, DY - 1.4 + k * 0.12, 2.75), 0.035, red, segs=8, name='led')

# sodium lamps on arms
for k, y in enumerate([0, 13, 26, 40]):
    sgn = 1 if k % 2 else -1
    cyl((sgn * 3.4, y, 3.5), 0.08, 7, dark, verts=10, name='pole'); box((sgn * 2.7, y, 6.9), (1.4, 0.12, 0.12), dark, name='arm')
    box((sgn * 2.1, y, 6.82), (0.5, 0.3, 0.1), sodium, name='lamp')
    light('SPOT', (sgn * 2.1, y, 6.7), 1500, (1.0, 0.55, 0.2), rot=(0, 0, 0), size=0.3, spot=(math.radians(70), 0.6), name='sodium_spot')

# the elite tower far down the street: clean white light through haze
box((1.5, 140, 45), (9, 9, 90), elite, name='tower'); box((1.5, 140, 95), (5, 5, 12), elite, name='spire')
light('SPOT', (1.5, 140, 100), 4e5, (0.8, 0.9, 1.0), rot=(math.radians(-25), 0, 0), size=1, spot=(math.radians(6), 0.2), name='beacon')

# ---------- the queue ----------
def person(x, y, scale=1.0, c=None, hood=True, sway=0.0):
    c = c or random.choice(cloth); s = scale; parts = []
    parts.append(cyl((x, y, 0.42 * s), 0.08 * s, 0.84 * s, c, verts=8, name='legs'))
    parts.append(cyl((x, y, 1.18 * s), 0.25 * s, 0.75 * s, c, verts=12, r2=0.13 * s, name='coat'))
    parts.append(sphere((x, y, 1.66 * s), 0.11 * s, skin, segs=12, name='head'))
    if hood: parts.append(cyl((x, y + 0.02, 1.7 * s), 0.16 * s, 0.36 * s, c, verts=12, r2=0.09 * s, name='hood'))
    if random.random() < 0.4: parts.append(box((x + 0.24 * s, y, 1.0 * s), (0.12, 0.3, 0.35), c, name='bag'))
    # one empty root per person so the whole figure can sway
    bpy.ops.object.empty_add(location=(x, y, 0)); root = bpy.context.object
    for p in parts: p.parent = root; p.location -= root.location
    ph = random.uniform(0, 6.28)
    for f in range(F0, F1 + 1, 24):
        root.rotation_euler = (math.sin(f * 0.05 + ph) * 0.015, 0, math.sin(f * 0.04 + ph) * 0.06 + sway); root.keyframe_insert('rotation_euler', frame=f)
    return root
for i in range(13):
    person(-2.3 + random.uniform(-0.25, 0.3), DY - 0.8 - i * 0.95 + random.uniform(-0.15, 0.15) + 30 * 0, random.uniform(0.92, 1.06), sway=random.uniform(-0.3, 0.3))
# awning strip lights over the line so the people read as figures, not lumps
for k in range(3): light('AREA', (-2.4, DY - 2.5 - k * 4, 3.3), 80, (1.0, 0.7, 0.4), size=2.5, name='awning'); box((-2.4, DY - 2.5 - k * 4, 3.36), (0.15, 2.4, 0.04), sodium, name='strip')
# a few stragglers on the far side
for i in range(5): person(random.uniform(1.0, 2.6), random.uniform(14, 34), random.uniform(0.9, 1.05))

# billboard on the right wall: the exodus programme, selling seats nobody here can buy
box((3.65, 15, 4.2), (0.12, 5, 2.4), emission('bb', (1.0, 0.62, 0.28), 2.2), name='billboard')
text_mesh('ARIADNE SYSTEMS', (3.57, 15, 4.75), 0.42, mat('ink', (0.01, 0.01, 0.01), 0, 0.8), rot=(math.pi / 2, 0, -math.pi / 2), font=SANS)
text_mesh('THE FUTURE HAS A WAITING LIST', (3.57, 15, 4.05), 0.2, mat('ink2', (0.01, 0.01, 0.01), 0, 0.8), rot=(math.pi / 2, 0, -math.pi / 2), font=MONO)
light('AREA', (3.0, 15, 4.2), 120, (1.0, 0.62, 0.28), rot=(0, math.radians(90), 0), size=4, name='bb_spill')
# steam from grates + street haze
for k, y in enumerate([4, 18, 31]): volume_box('steam%d' % k, (random.uniform(-1, 1.5), y, 1.5), (2.2, 2.2, 3.2), density=0.6, color=(0.8, 0.8, 0.82), noise_scale=1.4, animate_w=(0, 3.5, F0, F1))
volume_box('haze', (0, 40, 8), (14, 100, 18), density=0.06, color=(0.75, 0.72, 0.7), noise_scale=0.08, animate_w=(0, 0.6, F0, F1))

# ---------- camera: slow low dolly down the queue ----------
cam = camera((0.9, -9, 1.45), (-0.6, 12, 2.1), lens=32)
key(cam, 'location', F0, (1.1, -15, 1.35)); key(cam, 'location', F1, (0.5, -9.5, 1.55))
r0 = cam.rotation_euler.copy(); key(cam, 'rotation_euler', F0, r0); look_at(cam, (-1.5, 12, 2.2)); key(cam, 'rotation_euler', F1); ease_all(cam)
render('street', F0, F1)
