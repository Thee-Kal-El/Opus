# ESCAPE VELOCITY · anime reel (9:16) — cel-shaded Blender scene: MERIDIAN on its pad at golden hour, painted sky, cel clouds,
# the helmeted crew walking out, ignition with billowing cel smoke, lift-off. Toon look = Diffuse → Shader-to-RGB → constant ramp
# (shadow / base / highlight) + Freestyle ink lines, Standard view transform so the flat colours stay flat.
#   blender -b --python escanime/scene.py -- --shot reveal|crew|hull|ignite|climb [--test F] [--res 1080x1920]
import sys, os, math, random
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'esc2'))
import bpy, mathutils
import blib
from blib import box, cyl, sphere, light, camera, look_at, key, linear, ease_all, text_mesh, arg, SANS, MONO
V = mathutils.Vector

SHOT = arg('--shot', 'reveal')
LEN = {'reveal': 144, 'crew': 120, 'hull': 96, 'ignite': 120, 'climb': 144}[SHOT]
F0, F1 = 1, LEN

# ---------- scene setup ----------
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene; sc.render.engine = 'BLENDER_EEVEE'; e = sc.eevee
e.taa_render_samples = 8; e.use_bloom = True; e.bloom_intensity = 0.04; e.bloom_threshold = 1.2; e.use_soft_shadows = False; e.shadow_cube_size = '1024'; e.shadow_cascade_size = '4096'
e.use_motion_blur = False
sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'
sc.render.fps = 24
res = arg('--res', '720x1280').split('x'); sc.render.resolution_x, sc.render.resolution_y = int(res[0]), int(res[1]); sc.render.resolution_percentage = 100
sc.render.image_settings.file_format = 'PNG'; sc.render.image_settings.color_mode = 'RGBA'; sc.render.film_transparent = True   # sky is painted in the 2D pass
sc.render.use_freestyle = True; sc.render.line_thickness_mode = 'ABSOLUTE'; sc.render.line_thickness = 2.2 * int(res[0]) / 1080
vl = sc.view_layers[0]; fs = vl.freestyle_settings; ls = fs.linesets[0] if fs.linesets else fs.linesets.new('ink')
ls.select_by_visibility = True; ls.visibility = 'VISIBLE'; ls.select_silhouette = True; ls.select_border = True; ls.select_crease = True; ls.select_external_contour = True
if ls.linestyle is None: ls.linestyle = bpy.data.linestyles.new('ink')
ls.linestyle.color = (0.09, 0.07, 0.16); ls.linestyle.thickness = 2.2 * int(res[0]) / 1080; fs.crease_angle = math.radians(120); fs.use_culling = True
random.seed(77)

# painted sky: gradient on the view direction's height (horizon gold → rose → violet → night blue)
w = bpy.data.worlds.new('sky'); sc.world = w; w.use_nodes = True; nt = w.node_tree; bg = nt.nodes['Background']
tc = nt.nodes.new('ShaderNodeTexCoord'); sp = nt.nodes.new('ShaderNodeSeparateXYZ'); nt.links.new(tc.outputs['Generated'], sp.inputs[0])
ramp = nt.nodes.new('ShaderNodeValToRGB'); nt.links.new(sp.outputs['Z'], ramp.inputs[0]); cr = ramp.color_ramp
for pos, col in [(0.0, (1.0, 0.5, 0.2)), (0.49, (1.0, 0.62, 0.22)), (0.52, (1.0, 0.5, 0.32)), (0.57, (0.95, 0.36, 0.42)), (0.64, (0.55, 0.26, 0.62)), (0.75, (0.16, 0.14, 0.45)), (1.0, (0.03, 0.04, 0.14))]:
    el = cr.elements.new(pos) if pos not in (0.0, 1.0) else (cr.elements[0] if pos == 0.0 else cr.elements[1]); el.position = pos; el.color = (*col, 1)
nt.links.new(ramp.outputs['Color'], bg.inputs['Color']); bg.inputs['Strength'].default_value = 1.0

def toon(name, base, shade=None, hi=None, split=0.42, emit=1.0):
    """cel material: lit/shadow split by a constant ramp; shadow tinted toward violet like a painted anime background"""
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree
    for n in list(nt.nodes): nt.nodes.remove(n)
    d = nt.nodes.new('ShaderNodeBsdfDiffuse'); d.inputs['Color'].default_value = (1, 1, 1, 1)
    s2r = nt.nodes.new('ShaderNodeShaderToRGB'); nt.links.new(d.outputs[0], s2r.inputs[0])
    bw = nt.nodes.new('ShaderNodeRGBToBW'); nt.links.new(s2r.outputs['Color'], bw.inputs[0])
    r = nt.nodes.new('ShaderNodeValToRGB'); r.color_ramp.interpolation = 'CONSTANT'; nt.links.new(bw.outputs[0], r.inputs[0])
    shade = shade or tuple(c * 0.5 + t for c, t in zip(base, (0.04, 0.02, 0.12))); hi = hi or tuple(min(1, c * 1.12 + 0.06) for c in base)
    r.color_ramp.elements[0].position = 0.0; r.color_ramp.elements[0].color = (*shade, 1)
    r.color_ramp.elements[1].position = split; r.color_ramp.elements[1].color = (*base, 1)
    h = r.color_ramp.elements.new(min(0.95, split + 0.5)); h.color = (*hi, 1)
    em = nt.nodes.new('ShaderNodeEmission'); em.inputs['Strength'].default_value = emit; nt.links.new(r.outputs['Color'], em.inputs['Color'])
    o = nt.nodes.new('ShaderNodeOutputMaterial'); nt.links.new(em.outputs[0], o.inputs[0]); return m
def flat(name, col, strength=1.0):
    m = blib.emission(name, col, strength); return m
def no_lines(o):  # keep ink off soft things (clouds get their own outline pass via silhouettes only)
    o.data.materials[0]; return o

# ---------- palette ----------
WHITE = toon('white', (1.0, 0.86, 0.72), (0.46, 0.38, 0.66), (1.0, 0.97, 0.88))
RED = toon('red', (0.85, 0.2, 0.18), (0.42, 0.1, 0.22))
STEEL = toon('steel', (0.38, 0.4, 0.48), (0.18, 0.17, 0.3))
GANTRY = toon('gantry', (0.88, 0.42, 0.16), (0.42, 0.16, 0.18))
CONCRETE = toon('concrete', (0.78, 0.62, 0.55), (0.32, 0.24, 0.42))
GRASS = toon('ground', (0.36, 0.3, 0.36), (0.16, 0.12, 0.26), (0.62, 0.42, 0.36))
INK = flat('ink', (0.06, 0.05, 0.12))
CLOUD = toon('cloud', (1.0, 0.72, 0.55), (0.55, 0.36, 0.68), (1.0, 0.93, 0.78), split=0.5)
SMOKE = toon('smoke', (0.96, 0.94, 0.92), (0.64, 0.6, 0.76), (1.0, 1.0, 0.98), split=0.3)
SUIT = toon('suit', (1.0, 0.88, 0.76), (0.4, 0.34, 0.6), (1.0, 0.97, 0.9))
VISOR = toon('visor', (0.95, 0.7, 0.25), (0.45, 0.2, 0.25), (1.0, 0.95, 0.75), split=0.3)
FLAME = flat('flame', (1.0, 0.85, 0.45), 6); CORE = flat('core', (1.0, 1.0, 0.95), 10)
FAR = flat('far', (0.55, 0.36, 0.55)); FAR2 = flat('far2', (0.72, 0.46, 0.55))

# ---------- sun ----------
sun = light('SUN', (0, 0, 0), 4.0, (1.0, 0.92, 0.8), size=0.0)
SUN_DIR = V((0.35, 1.0, -0.22)).normalized()     # low sun behind the rocket (back-light for the crew shot)
if SHOT in ('reveal', 'hull', 'climb', 'ignite'): SUN_DIR = V((-0.75, 0.45, -0.45)).normalized()   # side light for form
sun.rotation_euler = SUN_DIR.to_track_quat('-Z', 'Y').to_euler()
# sun disc painted into the sky (far away, emissive)
SUN_POS = V((SUN_DIR.x * -3000, SUN_DIR.y * -3000, 160)) if SHOT != 'crew' else V((-260, 2600, 260))
# (the sun disc itself is painted in the 2D pass; SUN_POS is kept for reference)

# ---------- ground, pad, distant hills ----------
gp = box((0, 0, -0.5), (4000, 4000, 1), GRASS, name='ground')
box((0, 0, 3), (60, 60, 6), CONCRETE, name='deck'); box((0, 0, 3.05), (14, 64, 6.2), flat('trench', (0.08, 0.06, 0.14)), name='trench')
for k in range(14):  # distant hills and a city skyline, flat colour layers
    a = -0.9 + k * 0.13; R = random.uniform(1200, 1600); h = random.uniform(60, 180)
    box((math.sin(a) * R, math.cos(a) * R, h / 2 - 20), (random.uniform(300, 500), 80, h), FAR if k % 2 else FAR2, rot=(0, 0, -a), name='hill')
for k in range(40):
    a = -0.5 + k * 0.025; R = 900; h = random.uniform(30, 120)
    box((math.sin(a) * R, math.cos(a) * R, h / 2), (random.uniform(12, 26), 20, h), flat('city', (0.42, 0.28, 0.48)), rot=(0, 0, -a), name='skyline')

# ---------- MERIDIAN ----------
Z0 = 6; ship = []
ship.append(cyl((0, 0, Z0 + 52), 5.5, 84, WHITE, verts=48, name='hull'))
ship.append(cyl((0, 0, Z0 + 101), 5.5, 14, WHITE, verts=48, r2=0.4, name='nose'))
for z in (Z0 + 20, Z0 + 78): ship.append(cyl((0, 0, z), 5.62, 2.6, RED, verts=48, name='band'))
ship.append(cyl((0, 0, Z0 + 92), 5.6, 1.0, INK, verts=48, name='pinstripe'))
for k, a in enumerate((math.radians(90), math.radians(210), math.radians(330))):
    p = V((7.4 * math.cos(a), 7.4 * math.sin(a), 0))
    ship.append(cyl(p + V((0, 0, Z0 + 20)), 2.3, 30, WHITE, verts=24, name='booster')); ship.append(cyl(p + V((0, 0, Z0 + 37)), 2.3, 4, RED, verts=24, r2=0.3, name='booster_nose'))
    ship.append(cyl(p + V((0, 0, Z0 + 4.2)), 1.2, 2.4, STEEL, verts=16, r2=1.9, name='bell'))
for a in range(3): ship.append(cyl((2.2 * math.cos(a * 2.09), 2.2 * math.sin(a * 2.09), Z0 + 8.6), 1.1, 2.6, STEEL, verts=16, r2=2.0, name='bell'))
t1 = text_mesh('MERIDIAN', (0, -5.56, Z0 + 60), 3.0, INK, font=SANS); t1.rotation_euler = (math.pi / 2, 0, 0); ship.append(t1)
t2 = text_mesh('ARIADNE SYSTEMS', (0, -5.56, Z0 + 56.2), 0.95, RED, font=MONO); ship.append(t2)
ship.append(text_mesh('EV-01', (0, -5.56, Z0 + 30), 2.0, INK, font=SANS))
for o in (t1, t2): o.visible_shadow = False
bpy.ops.object.empty_add(location=(0, 0, 0)); ship_root = bpy.context.object; ship_root.name = 'ship_root'
for o in ship: o.parent = ship_root

# gantry tower (anime orange lattice)
GX = -16
for sx in (-1, 1):
    for sy in (-1, 1): cyl((GX + sx * 3.5, sy * 3.5, 60), 0.45, 120, GANTRY, verts=8, name='leg')
for z in range(6, 120, 6):
    for sy in (-1, 1): box((GX, sy * 3.5, z), (7.4, 0.5, 0.5), GANTRY, name='rail')
    box((GX + sy * 3.5 * 0 - 3.5, 0, z), (0.5, 7.4, 0.5), GANTRY, name='rail'); box((GX + 3.5, 0, z), (0.5, 7.4, 0.5), GANTRY, name='rail')
    # cross braces
    bpy.ops.mesh.primitive_cube_add(location=(GX, -3.5, z + 3), rotation=(0, math.radians(40), 0)); b = bpy.context.object; b.scale = (5.0, 0.18, 0.18); b.data.materials.append(GANTRY)
arm = box((GX + 8, 0, Z0 + 70), (9, 2.2, 2.2), GANTRY, name='arm')
sphere((GX, 0, 122), 0.8, flat('beacon', (1.0, 0.2, 0.15), 4), segs=12, name='beacon')

# light poles around the pad
for dx, dy in [(-45, -40), (45, -40), (-45, 40), (45, 40)]:
    cyl((dx, dy, 15), 0.4, 30, STEEL, verts=8, name='pole'); box((dx, dy, 30.5), (3, 1, 1.2), flat('lamp', (1.0, 0.95, 0.8), 2.5), name='lamp')

# ---------- cel clouds ----------
def cloud(center, size, n=14, mat=CLOUD, flatten=1.6, name='cloud'):
    parts = []
    for i in range(n):
        off = V((random.gauss(0, size * 0.9), random.gauss(0, size * 0.35), abs(random.gauss(0, size * 0.35)) * flatten))
        r = size * random.uniform(0.45, 0.9) * (1.15 - min(1, off.length / (size * 2)) * 0.5)
        parts.append(sphere(V(center) + off, r, mat, segs=20, name=name))
    return parts
for k in range(16):
    a = -0.8 + k * 0.11 + random.uniform(-0.03, 0.03); R = random.uniform(700, 1100)
    cloud((math.sin(a) * R, math.cos(a) * R, random.uniform(120, 300)), random.uniform(55, 95), n=22)

# ---------- crew ----------
def astronaut(pos, phase, scale=1.0):
    s = scale; parts = []; root_loc = V(pos)
    bpy.ops.object.empty_add(location=root_loc); root = bpy.context.object; root.name = 'astro'
    def add(o): o.parent = root; o.location -= root_loc; parts.append(o); return o
    t = add(sphere(root_loc + V((0, 0, 1.22 * s)), 0.36 * s, SUIT, segs=24, name='torso')); t.scale = (1.0, 0.8, 1.25)
    pk = add(sphere(root_loc + V((0, 0.3 * s, 1.32 * s)), 0.3 * s, SUIT, segs=20, name='pack')); pk.scale = (1.0, 0.55, 1.15)
    add(cyl(root_loc + V((0, 0.47 * s, 1.36 * s)), 0.07 * s, 0.42 * s, RED, verts=12, name='tank'))
    add(sphere(root_loc + V((0, 0, 1.9 * s)), 0.33 * s, SUIT, segs=28, name='helmet'))
    add(cyl(root_loc + V((0, 0, 1.62 * s)), 0.24 * s, 0.1 * s, STEEL, verts=20, name='collar'))
    for sx in (-1, 1): add(sphere(root_loc + V((sx * 0.36 * s, 0, 1.52 * s)), 0.13 * s, RED, segs=14, name='shoulder'))
    v = add(sphere(root_loc + V((0, -0.14 * s, 1.9 * s)), 0.27 * s, VISOR, segs=24, name='visor')); v.scale = (1.0, 0.75, 0.8)
    add(box(root_loc + V((0, 0, 0.92 * s)), (0.5 * s, 0.4 * s, 0.12 * s), RED, name='belt'))
    legs = []
    for sx in (-1, 1):
        bpy.ops.object.empty_add(location=root_loc + V((sx * 0.15 * s, 0, 0.88 * s))); hip = bpy.context.object; add(hip)
        lg = cyl(root_loc + V((sx * 0.15 * s, 0, 0.45 * s)), 0.12 * s, 0.85 * s, SUIT, verts=12, name='leg'); lg.parent = hip; lg.location = (0, 0, -0.43 * s)
        bt = box(root_loc + V((sx * 0.15 * s, -0.05 * s, 0.06 * s)), (0.2 * s, 0.32 * s, 0.14 * s), STEEL, name='boot'); bt.parent = hip; bt.location = (0, -0.05 * s, -0.82 * s)
        legs.append((hip, sx))
    for sx in (-1, 1):
        bpy.ops.object.empty_add(location=root_loc + V((sx * 0.4 * s, 0, 1.5 * s))); sh = bpy.context.object; add(sh)
        a = cyl(root_loc, 0.1 * s, 0.7 * s, SUIT, verts=12, name='arm'); a.parent = sh; a.location = (0, 0, -0.35 * s)
        legs.append((sh, -sx * 0.6))
    return root, legs
CREW = []
if SHOT == 'crew':
    for i in range(6):
        x = (i % 3 - 1) * 1.6 + (0.4 if i >= 3 else 0); y = -95 - (i // 3) * 1.8
        CREW.append((astronaut((x, y, 0), i * 0.9), i))

# ---------- shot logic ----------
def cam_path(cam, keys):
    for f, loc, tgt in keys: cam.location = loc; look_at(cam, tgt); key(cam, 'location', f); key(cam, 'rotation_euler', f)
    ease_all(cam)

if SHOT == 'reveal':   # start looking up into the painted sky, tilt down to MERIDIAN on the horizon
    cam = camera((30, -260, 6), (0, 0, 60), lens=28)
    cam_path(cam, [(F0, (30, -260, 6), (10, -60, 260)), (F1, (24, -235, 7), (0, 0, 48))])
elif SHOT == 'crew':   # low behind the six as they walk to the pad, sun flaring past the rocket
    for (root, limbs), i in CREW:
        y0 = root.location.y
        for f in range(F0, F1 + 1, 2):
            root.location.y = y0 + f * 0.035; root.location.z = abs(math.sin(f * 0.26 + i)) * 0.04; root.keyframe_insert('location', frame=f)
            for piv, sx in limbs:
                piv.rotation_euler = (math.sin(f * 0.26 + i) * 0.45 * (1 if sx > 0 else -1) * (abs(sx) if abs(sx) < 1 else 1), 0, 0); piv.keyframe_insert('rotation_euler', frame=f)
    cam = camera((1.5, -104, 0.7), (0, 0, 40), lens=24)
    cam_path(cam, [(F0, (2.2, -104.5, 0.6), (0, -40, 22)), (F1, (0.6, -100.5, 1.1), (0, 0, 36))])
elif SHOT == 'hull':   # rising up the hull past the stencils
    cam = camera((16, -30, 20), (0, 0, 20), lens=40)
    cam_path(cam, [(F0, (18, -32, 16), (-2, 0, 30)), (F1, (12, -27, 84), (-2, 0, 96))])
elif SHOT == 'ignite':  # wide low: engines light, cel smoke billows out of the trench, lift-off at frame 64
    IGN, LIFT = 18, 64
    for k, ob in enumerate([o for o in ship if o.name.startswith('bell')]):
        p = ob.location.copy()
        fl = cyl(p + V((0, 0, -8)), 1.8, 12, FLAME, verts=16, r2=0.25, rot=(math.pi, 0, 0), name='flame'); fl.parent = ship_root
        co = cyl(p + V((0, 0, -4.5)), 0.9, 5, CORE, verts=12, r2=0.1, rot=(math.pi, 0, 0), name='core'); co.parent = ship_root
        for o in (fl, co):
            key(o, 'scale', IGN - 1, (0.01,) * 3); key(o, 'scale', IGN + 5, (1, 1, 1))
            for f in range(IGN + 6, F1 + 1, 2): s_ = random.uniform(0.95, 1.1); o.scale = (s_, s_, random.uniform(1.2, 1.6) + (f - IGN) * 0.01); o.keyframe_insert('scale', frame=f)
    random.seed(5)
    for side in (-1, 1):  # smoke banks rolling out both sides of the trench
        for i in range(26):
            d = random.uniform(0.2, 1.0); c = sphere((side * 6, random.uniform(-6, 6), 4), random.uniform(5, 11), SMOKE, segs=18, name='smoke')
            t0 = IGN + int(i * 1.6)
            key(c, 'scale', t0, (0.01,) * 3); key(c, 'location', t0, (side * 6, c.location.y, 3))
            end = V((side * (14 + 70 * d), random.uniform(-26, 26), 4 + random.uniform(0, 22) * d))
            key(c, 'scale', min(F1, t0 + 50), (1, 1, 1)); key(c, 'location', min(F1, t0 + 50), end); key(c, 'location', F1, end + V((side * 6, 0, 3)))
    key(ship_root, 'location', LIFT, (0, 0, 0)); key(ship_root, 'location', F1, (0, 0, 26))
    for fc in ship_root.animation_data.action.fcurves:
        fc.keyframe_points[0].interpolation = 'QUAD'; fc.keyframe_points[0].easing = 'EASE_IN'
    cam = camera((60, -150, 4), (0, 0, 40), lens=32)
    cam_path(cam, [(F0, (62, -150, 4), (-2, 0, 48)), (F1, (55, -138, 5), (0, 0, 62))])
elif SHOT == 'climb':  # tracking the climb from below, contrail of cel cloud puffs, through a cloud deck
    for k, ob in enumerate([o for o in ship if o.name.startswith('bell')]):
        p = ob.location.copy()
        fl = cyl(p + V((0, 0, -12)), 2.1, 20, FLAME, verts=16, r2=0.2, rot=(math.pi, 0, 0), name='flame'); fl.parent = ship_root
        co = cyl(p + V((0, 0, -6)), 1.0, 8, CORE, verts=12, r2=0.1, rot=(math.pi, 0, 0), name='core'); co.parent = ship_root
        for f in range(F0, F1 + 1, 2): s_ = random.uniform(0.92, 1.1); fl.scale = (s_, s_, random.uniform(1.0, 1.4)); fl.keyframe_insert('scale', frame=f)
    zf = lambda f: 30 + 0.012 * (f + 40) ** 2 * 1.0   # accelerating climb
    for f in range(F0, F1 + 1, 4): ship_root.location = (0, 0, zf(f)); ship_root.keyframe_insert('location', frame=f)
    linear(ship_root)
    for i in range(110):  # contrail puffs: each appears at the nozzle when the ship passes, then swells
        f = int(i * LEN / 110) + 1; z = zf(f) + Z0 - 4; c = sphere((random.gauss(0, 1), random.gauss(0, 1), z), random.uniform(4, 6.5), SMOKE, segs=14, name='trail')
        key(c, 'scale', max(F0, f - 1), (0.01,) * 3); key(c, 'scale', f + 2, (1, 1, 1)); key(c, 'scale', min(F1 + 40, f + 60), (2.2, 2.2, 1.6))
    for k in range(10):  # a cloud deck the rocket punches through
        a = k * 0.63; cloud((math.cos(a) * random.uniform(30, 160), math.sin(a) * random.uniform(30, 160), 330 + random.uniform(-10, 10)), random.uniform(28, 45), n=10)
    cam = camera((40, -70, 10), (0, 0, 60), lens=30)
    for f in range(F0, F1 + 1, 6):
        z = zf(f); cam.location = (38 - f * 0.05, -68 + f * 0.05, 8 + z * 0.55); look_at(cam, (0, 0, z + 40)); key(cam, 'location', f); key(cam, 'rotation_euler', f)
    linear(cam)

# ---------- outlines: Freestyle only for near hard surfaces; soft/far things get an inverted-hull outline (depth-correct) ----------
OUTLINE = bpy.data.materials.new('outline'); OUTLINE.use_nodes = True; ont = OUTLINE.node_tree
for n in list(ont.nodes): ont.nodes.remove(n)
oe = ont.nodes.new('ShaderNodeEmission'); oe.inputs['Color'].default_value = (0.09, 0.07, 0.16, 1); oo = ont.nodes.new('ShaderNodeOutputMaterial'); ont.links.new(oe.outputs[0], oo.inputs[0])
OUTLINE.use_backface_culling = True
far = bpy.data.collections.new('far'); sc.collection.children.link(far)
for o in list(bpy.data.objects):
    if o.type == 'MESH' and o.name.split('.')[0] in ('cloud', 'smoke', 'trail', 'hill', 'skyline', 'ground'):
        for col in o.users_collection: col.objects.unlink(o)
        far.objects.link(o)
        if o.name.split('.')[0] in ('cloud', 'smoke', 'trail'):
            o.data.materials.append(OUTLINE); m = o.modifiers.new('ink', 'SOLIDIFY'); r = max(o.dimensions) / 2
            m.thickness = -max(0.12, r * 0.035); m.use_flip_normals = True; m.material_offset = 1; m.use_rim = False
ls.select_by_collection = True; ls.collection = far; ls.collection_negation = 'EXCLUSIVE'

# ---------- render ----------
out_root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'out')
sc.frame_start, sc.frame_end = F0, F1
test = arg('--test')
if test is not None:
    f = int(test); sc.frame_set(f); sc.render.filepath = os.path.join(out_root, 'anime_tests', f'{SHOT}_{f:04d}.png'); bpy.ops.render.render(write_still=True); print('WROTE', sc.render.filepath)
else:
    sc.render.use_overwrite = False; sc.render.use_placeholder = True
    sc.render.filepath = os.path.join(out_root, 'anime_frames', SHOT, '#####'); bpy.ops.render.render(animation=True); print('DONE', SHOT)
