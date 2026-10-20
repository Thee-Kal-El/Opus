# SHOT 4 (15.0–21.0s, 144 frames) — low orbit inside the debris belt; SAT-07 drifts in and is shattered at frame 61 (17.5s).
import sys, os, math, random
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import bpy, blib, mathutils
from blib import *
sc = setup(world_color=(0.012, 0.02, 0.04), world_strength=1.0)
F0, F1, HIT = 1, 144, 61

# Earth far below: reuse the window shot's material builder
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), '_earth.py')).read())
R = 600; earth = sphere((0, 260, -640), R, earth_material(), segs=256, name='earth'); clouds = sphere((0, 260, -640), R * 1.004, clouds_material(), segs=192, name='clouds'); atmo = sphere((0, 260, -640), R * 1.012, atmo_material(), segs=192, name='atmo')
sun = light('SUN', (0, 0, 0), 7.0, (1.0, 0.84, 0.66), rot=(math.radians(55), 0, math.radians(-40)), size=0.01, name='sun')
star_m = emission('star', (0.9, 0.93, 1.0), 6)
for i in range(240):
    a = random.uniform(-1.2, 1.2); e = random.uniform(0.0, 0.7); d = 1500
    sphere((math.sin(a) * d, math.cos(a) * d, math.sin(e) * d), random.uniform(0.6, 1.4), star_m, segs=6, name='star')

# materials
alu = grime_metal('alu', (0.55, 0.56, 0.58), 0.85, (0.2, 0.55), 30)
foil = grime_metal('foil', (0.8, 0.58, 0.2), 0.7, (0.2, 0.45), 40)
panel = mat('panel', (0.03, 0.06, 0.2), 0.3, 0.22, emit=(0.15, 0.3, 0.8), emit_strength=0.07)
burnt = grime_metal('burnt', (0.08, 0.075, 0.07), 0.5, (0.5, 0.9), 20)
MATS = [alu, alu, foil, panel, burnt]

def fragment(loc, s, m):
    kind = random.random()
    if kind < 0.4: o = box(loc, (s * random.uniform(0.4, 1.6), s * random.uniform(0.05, 0.4), s * random.uniform(0.3, 1.2)), m, name='frag')
    elif kind < 0.7: bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=s * 0.6, location=loc); o = bpy.context.object; o.data.materials.append(m); o.scale = (random.uniform(0.5, 1.4), random.uniform(0.3, 1), random.uniform(0.5, 1.4))
    else: o = cyl(loc, s * 0.15, s * random.uniform(0.8, 2.2), m, verts=10, name='frag')
    return o

# drifting debris field (keyframed straight-line drift + tumble)
for i in range(420):
    x, y, z = random.uniform(-60, 60), random.uniform(-10, 260), random.uniform(-14, 18)
    o = fragment((x, y, z), random.uniform(0.3, 2.4) * (1 + 2 * (random.random() < 0.06)), random.choice(MATS))
    v = mathutils.Vector((random.uniform(-0.6, 0.6), -random.uniform(1.0, 4.0), random.uniform(-0.2, 0.2)))
    r0 = mathutils.Euler((random.uniform(0, 6), random.uniform(0, 6), random.uniform(0, 6))); w = mathutils.Vector((random.uniform(-1, 1), random.uniform(-1, 1), random.uniform(-1, 1))) * 0.6
    for f in (F0, F1): t = (f - F0) / 24; o.location = mathutils.Vector((x, y, z)) + v * t * 6; o.rotation_euler = (r0.x + w.x * t, r0.y + w.y * t, r0.z + w.z * t); o.keyframe_insert('location', frame=f); o.keyframe_insert('rotation_euler', frame=f)
    linear(o)

# SAT-07: bus + solar wings + dish
SP = mathutils.Vector((1.5, 22, 2.2))
bus = box(SP, (2.4, 2.4, 3.2), foil, name='sat_bus')
parts = [bus]
for sgn in (-1, 1):
    for k in range(3): parts.append(box(SP + mathutils.Vector((sgn * (2.6 + k * 2.3), 0, 0)), (2.2, 0.08, 2.6), panel, name='sat_panel'))
    parts.append(cyl(SP + mathutils.Vector((sgn * 1.7, 0, 0)), 0.08, 1.2, alu, rot=(0, math.pi / 2, 0), verts=8, name='sat_arm'))
nav = sphere(SP + mathutils.Vector((0, -1.25, 1.7)), 0.12, emission('nav', (1.0, 0.1, 0.05), 60), segs=8, name='sat_nav'); parts.append(nav)
for f in range(F0, HIT, 12): nav.hide_render = False; nav.keyframe_insert('hide_render', frame=f); nav.hide_render = True; nav.keyframe_insert('hide_render', frame=f + 6)
dish = sphere(SP + mathutils.Vector((0, -1.0, 1.9)), 1.0, alu, segs=24, name='sat_dish'); dish.scale = (1, 0.35, 1); parts.append(dish)
for o in parts:
    o0 = o.location.copy()
    for f in (F0, HIT): t = (f - F0) / 24; o.location = o0 + mathutils.Vector((0, -0.9 * t, 0)); o.keyframe_insert('location', frame=f)
    o.hide_render = False; o.keyframe_insert('hide_render', frame=HIT - 1); o.hide_render = True; o.keyframe_insert('hide_render', frame=HIT); linear(o)
HP = SP + mathutils.Vector((0, -0.9 * (HIT - F0) / 24, 0))
# the projectile: a bright streak arriving from the left
proj = cyl(HP, 0.12, 3.0, emission('streak', (1.0, 0.85, 0.6), 60), rot=(0, math.pi / 2, 0.35), verts=8, name='proj')
key(proj, 'location', HIT - 10, HP + mathutils.Vector((-70, -18, 8))); key(proj, 'location', HIT, HP); proj.hide_render = False; proj.keyframe_insert('hide_render', frame=HIT); proj.hide_render = True; proj.keyframe_insert('hide_render', frame=HIT + 1); linear(proj)
# shatter: fragments burst outward from the impact point
for i in range(150):
    d = mathutils.Vector((random.uniform(-1, 1), random.uniform(-1, 1), random.uniform(-1, 1))).normalized() * random.uniform(4, 22)
    o = fragment(HP, random.uniform(0.15, 1.1), random.choice([foil, panel, panel, alu]))
    o.scale *= 0.001; o.keyframe_insert('scale', frame=HIT - 1); o.scale *= 1000; o.keyframe_insert('scale', frame=HIT)
    for f in (HIT, F1): t = (f - HIT) / 24; o.location = HP + d * t; o.rotation_euler = (t * random.uniform(-4, 4), t * random.uniform(-4, 4), t * random.uniform(-4, 4)); o.keyframe_insert('location', frame=f); o.keyframe_insert('rotation_euler', frame=f)
    if o.animation_data and o.animation_data.action:
        for fc in o.animation_data.action.fcurves:
            for kp in fc.keyframe_points: kp.interpolation = 'CONSTANT' if fc.data_path == 'scale' else 'LINEAR'
# flash + fireball light
flash = sphere(HP, 1.0, emission('flash', (1.0, 0.7, 0.4), 25), segs=24, name='flash')
for f, s in ((HIT - 1, 0.01), (HIT, 1.2), (HIT + 3, 2.2), (HIT + 9, 0.01)): flash.scale = (s, s, s); flash.keyframe_insert('scale', frame=f)
fl = light('POINT', HP, 0, (1.0, 0.7, 0.4), size=2, name='flash_light')
for f, e in ((HIT - 1, 0), (HIT, 6e5), (HIT + 6, 1.5e5), (HIT + 24, 0)): fl.data.energy = e; fl.data.keyframe_insert('energy', frame=f)

cam = camera((0, -8, 4.5), (0, 40, 0.5), lens=30)
key(cam, 'location', F0, (-1.5, -10, 4.0)); key(cam, 'location', F1, (1.5, -2, 5.2)); ease_all(cam)
render("debris", F0, F1)
