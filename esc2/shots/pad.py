# SHOTS 7–9 · Launch Complex 39-X — MERIDIAN on the pad at night in the rain. One scene, three cameras:
#   --cam wide      33.0–38.0 s  (120 f)  behind the perimeter fence, slow push in, floods + steam
#   --cam close     45.0–50.5 s  (132 f)  low at the base, tilt up the hull past the stencils, gantry arm swings away
#   --cam ignition  50.5–56.6 s  (146 f)  the breach at the fence line (explosion, fire) → engines light → lift-off begins
import sys, os, math, random
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
import bpy, blib, mathutils
from blib import *
V = mathutils.Vector

CAM = arg('--cam', 'wide')
F0, F1 = 1, {'wide': 120, 'close': 132, 'ignition': 146}[CAM]
BREACH, IGN, LIFT = 8, 98, 118          # ignition-shot frames
sc = setup(world_color=(0.01, 0.012, 0.016), world_strength=1.0)
sc.eevee.volumetric_end = 600

# ---------- materials ----------
wet = mat('wet_pad', (0.03, 0.03, 0.032), 0.2, 0.1)
nt = wet.node_tree; b = nt.nodes['Principled BSDF']; nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 0.08; nz.inputs['Detail'].default_value = 6
mr = nt.nodes.new('ShaderNodeMapRange'); mr.inputs['From Min'].default_value = 0.42; mr.inputs['From Max'].default_value = 0.62; mr.inputs['To Min'].default_value = 0.05; mr.inputs['To Max'].default_value = 0.6
tc = nt.nodes.new('ShaderNodeTexCoord'); nt.links.new(tc.outputs['Object'], nz.inputs['Vector']); nt.links.new(nz.outputs['Fac'], mr.inputs['Value']); nt.links.new(mr.outputs['Result'], b.inputs['Roughness'])
hull = grime_metal('hull', (0.62, 0.6, 0.55), 0.55, (0.25, 0.6), 0.6)
steel = grime_metal('steel', (0.08, 0.075, 0.07), 0.8, (0.3, 0.75), 1.5)
rust = grime_metal('rust', (0.16, 0.08, 0.04), 0.5, (0.5, 0.9), 2)
ink = mat('ink', (0.015, 0.015, 0.015), 0.0, 0.7)
hazard = mat('hazard', (0.7, 0.45, 0.05), 0.2, 0.5)
sodium = emission('sodium', (1.0, 0.55, 0.18), 30)
red = emission('red', (1.0, 0.05, 0.03), 60)
flame_m = emission('flame', (1.0, 0.72, 0.38), 120)
core_m = emission('core', (0.75, 0.85, 1.0), 300)

# ---------- pad + ship ----------
box((0, 0, -0.5), (900, 900, 1), wet, name='ground')
box((0, 0, 4), (60, 60, 8), steel, name='deck'); box((0, 0, 4.1), (14, 70, 8.3), mat('trench', (0.005, 0.005, 0.005), 0, 0.9), name='flame_trench')
for sx in (-1, 1): box((sx * 30.2, 0, 7.6), (0.6, 60, 0.4), hazard, name='deck_edge')
Z0 = 8
ship = []
ship.append(cyl((0, 0, Z0 + 52), 5.5, 84, hull, verts=64, name='meridian'))
ship.append(cyl((0, 0, Z0 + 101), 5.5, 14, hull, verts=64, r2=0.5, name='nose'))
for z in (Z0 + 18, Z0 + 46, Z0 + 76): ship.append(cyl((0, 0, z), 5.62, 1.4, steel, verts=64, name='band'))
for a in (math.radians(90), math.radians(210), math.radians(330)):
    p = V((7.4 * math.cos(a), 7.4 * math.sin(a), 0))
    ship.append(cyl(p + V((0, 0, Z0 + 20)), 2.3, 30, hull, verts=32, name='booster')); ship.append(cyl(p + V((0, 0, Z0 + 37)), 2.3, 4, hull, verts=32, r2=0.3, name='booster_nose'))
    ship.append(cyl(p + V((0, 0, Z0 + 4.2)), 1.2, 2.4, steel, verts=24, r2=1.9, name='bell'))
for a in range(3): ship.append(cyl((2.2 * math.cos(a * 2.09), 2.2 * math.sin(a * 2.09), Z0 + 8.6), 1.1, 2.6, steel, verts=24, r2=2.0, name='bell'))
# stencils facing the fence side (−Y)
ship.append(text_mesh('MERIDIAN', (0, -5.52, Z0 + 58), 2.6, ink, rot=(math.pi / 2, 0, 0), font=SANS)); ship[-1].rotation_euler = (math.pi / 2, 0, 0)
ship.append(text_mesh('ARIADNE SYSTEMS  ·  EOA-7', (0, -5.52, Z0 + 54.5), 0.8, ink, font=MONO))
ship.append(text_mesh('NO STEP', (2.9, -6.6, Z0 + 26), 0.45, ink, font=MONO))
for z in range(int(Z0 + 12), int(Z0 + 92), 6):  # hatch / panel seams
    ship.append(cyl((0, 0, z), 5.53, 0.06, steel, verts=64, name='seam'))
# the stack is curved: text needs to sit just off the hull; good enough at film distance
bpy.ops.object.empty_add(location=(0, 0, 0)); ship_root = bpy.context.object; ship_root.name = 'ship_root'
for o in ship: o.parent = ship_root

# gantry tower + swing arms + lights
GX = -17
box((GX, 0, 62), (8, 8, 124), steel, name='gantry')
for z in range(10, 124, 8):
    box((GX, -4.05, z), (8.1, 0.15, 0.25), rust, name='gantry_rung')
    sphere((GX + 4.2, -4.2, z), 0.25, red if z % 16 else sodium, segs=8, name='gantry_lamp')
arms = []
for z in (Z0 + 30, Z0 + 62, Z0 + 92):
    bpy.ops.object.empty_add(location=(GX + 4, 0, z)); piv = bpy.context.object; piv.name = 'arm_pivot'
    a = box((GX + 8.5, 0, z), (9, 2.2, 2.2), steel, name='swing_arm'); a.parent = piv; a.location = (4.5, 0, 0); arms.append(piv)
# floods on masts + volumetric beams
FLOODS = []
for k, (dx, dy) in enumerate([(-55, -45), (55, -45), (-55, 45), (55, 45), (34, -72)]):
    cyl((dx, dy, 18), 0.5, 36, steel, verts=8, name='mast'); box((dx, dy, 36.5), (3, 1, 1.4), sodium, name='flood_head')
    s = light('SPOT', (dx, dy, 37), 6e5, (1.0, 0.82, 0.6), size=0.6, spot=(math.radians(42), 0.35), name='flood'); look_at(s, (0, 0, 40 + (k % 3) * 20)); FLOODS.append(s)
# rotating red beacons on the deck corners
BEACONS = []
for k, (dx, dy) in enumerate([(-28, -28), (28, -28), (-28, 28), (28, 28)]):
    cyl((dx, dy, 9), 0.4, 2, steel, verts=12, name='beacon_post'); sphere((dx, dy, 10.2), 0.4, red, segs=12, name='beacon')
    s = light('SPOT', (dx, dy, 10.4), 3e4, (1.0, 0.08, 0.04), size=0.2, spot=(math.radians(30), 0.5), name='beacon_spot'); BEACONS.append((s, k))

# perimeter: chain-link-ish fence (posts + rails + mesh plane) at y = −110, with warning signs
FY = -110
fence_m = mat('fence', (0.25, 0.25, 0.25), 0.9, 0.4)
for x in range(-120, 121, 6):
    cyl((x, FY, 2.2), 0.07, 4.4, steel, verts=6, name='post')
for z in (0.3, 2.2, 4.3): cyl((0, FY, z), 0.04, 240, steel, verts=6, rot=(0, math.pi / 2, 0), name='rail')
bpy.ops.mesh.primitive_plane_add(size=1, location=(0, FY, 2.2), rotation=(math.pi / 2, 0, 0)); mesh = bpy.context.object; mesh.scale = (240, 4.4, 1); mesh.name = 'mesh'
fm = bpy.data.materials.new('chainlink'); fm.use_nodes = True; fnt = fm.node_tree; fb = fnt.nodes['Principled BSDF']; fb.inputs['Base Color'].default_value = (0.3, 0.3, 0.3, 1); fb.inputs['Metallic'].default_value = 0.9; fb.inputs['Roughness'].default_value = 0.4
ftc = fnt.nodes.new('ShaderNodeTexCoord'); fwv = fnt.nodes.new('ShaderNodeTexWave'); fwv.wave_type = 'BANDS'; fwv.bands_direction = 'DIAGONAL'; fwv.inputs['Scale'].default_value = 900
fwv2 = fnt.nodes.new('ShaderNodeTexWave'); fwv2.wave_type = 'BANDS'; fwv2.bands_direction = 'DIAGONAL'; fwv2.inputs['Scale'].default_value = 900
fmp = fnt.nodes.new('ShaderNodeMapping'); fmp.inputs['Scale'].default_value = (-1, 1, 1); fnt.links.new(ftc.outputs['UV'], fwv.inputs['Vector']); fnt.links.new(ftc.outputs['UV'], fmp.inputs['Vector']); fnt.links.new(fmp.outputs['Vector'], fwv2.inputs['Vector'])
fmx = fnt.nodes.new('ShaderNodeMath'); fmx.operation = 'MAXIMUM'; fnt.links.new(fwv.outputs['Fac'], fmx.inputs[0]); fnt.links.new(fwv2.outputs['Fac'], fmx.inputs[1])
fgt = fnt.nodes.new('ShaderNodeMath'); fgt.operation = 'GREATER_THAN'; fgt.inputs[1].default_value = 0.88; fnt.links.new(fmx.outputs[0], fgt.inputs[0]); fnt.links.new(fgt.outputs[0], fb.inputs['Alpha'])
fm.blend_method = 'HASHED'; fm.shadow_method = 'HASHED'; mesh.data.materials.append(fm)
for x in (-30, 18, 64): box((x, FY - 0.1, 2.6), (1.6, 0.04, 1.1), hazard, name='sign'); text_mesh('RESTRICTED · EOA', (x, FY - 0.14, 2.45), 0.2, ink, font=MONO)

# rain-soaked haze around the pad; steam venting off the hull
volume_box('pad_haze', (0, 0, 60), (300, 300, 140), density=0.02, color=(0.8, 0.8, 0.85), noise_scale=2.0, animate_w=(0, 1.2, F0, F1))
for k, (x, y, z) in enumerate([(5.8, -1, Z0 + 22), (-5.6, 2, Z0 + 48), (4, -4, Z0 + 76), (0, -6, Z0 + 6)]):
    volume_box('steam%d' % k, (x * 1.4, y * 1.4, z), (10, 10, 14), density=0.5, color=(0.9, 0.9, 0.92), noise_scale=2.4, animate_w=(k, k + 2.5, F0, F1))

# ---------- per-camera action ----------
def beacons_spin(f0, f1, rate=0.18):
    for s, k in BEACONS:
        for f in range(f0, f1 + 1, 2):
            a = f * rate + k * 1.6; s.rotation_euler = (math.radians(80), 0, a); s.keyframe_insert('rotation_euler', frame=f)
        linear(s)
beacons_spin(F0, F1, 0.18 if CAM != 'ignition' else 0.3)

if CAM == 'wide':
    cam = camera((6, FY - 14, 1.7), (0, 0, 45), lens=35)
    key(cam, 'location', F0, (8, FY - 16, 1.6)); key(cam, 'location', F1, (4, FY - 7, 1.9))
    cam.location = (8, FY - 16, 1.6); look_at(cam, (-2, 0, 48)); key(cam, 'rotation_euler', F0); cam.location = (4, FY - 7, 1.9); look_at(cam, (0, 0, 52)); key(cam, 'rotation_euler', F1); ease_all(cam)

elif CAM == 'close':
    for piv in arms:  # arms swing away from the hull
        key(piv, 'rotation_euler', 30, (0, 0, 0)); key(piv, 'rotation_euler', 110, (0, 0, math.radians(-70))); ease_all(piv)
    cam = camera((8, -16, 3), (0, 0, 20), lens=24)
    key(cam, 'location', F0, (9, -15, 9.5)); key(cam, 'location', F1, (7.5, -13, 12))
    cam.location = (9, -15, 9.5); look_at(cam, (0, 0, 18)); key(cam, 'rotation_euler', F0); cam.location = (7.5, -13, 12); look_at(cam, (0, -2, 68)); key(cam, 'rotation_euler', F1); ease_all(cam)
    light('AREA', (12, -14, 12), 2500, (1.0, 0.7, 0.4), size=6, name='hull_fill'); look_at(bpy.context.object, (0, 0, 30))

else:  # ignition
    for piv in arms: piv.rotation_euler = (0, 0, math.radians(-70))
    # BREACH: an explosion at the fence line, left of frame → fire that keeps burning
    BX = V((-30, -48, 1.5))
    fb_ = sphere(BX, 1, emission('blast', (1.0, 0.6, 0.25), 60), segs=24, name='blast')
    key(fb_, 'scale', BREACH - 1, (0.01,) * 3); key(fb_, 'scale', BREACH + 1, (3.5,) * 3); key(fb_, 'scale', BREACH + 6, (5,) * 3); key(fb_, 'scale', BREACH + 14, (0.01,) * 3)
    bl = light('POINT', BX + V((0, 0, 3)), 0, (1.0, 0.55, 0.2), size=3, name='blast_light')
    for f, e in [(BREACH - 1, 0), (BREACH + 1, 4e6), (BREACH + 8, 1.2e6), (BREACH + 30, 3e5)]: bl.data.energy = e; bl.data.keyframe_insert('energy', frame=f)
    for f in range(BREACH + 32, F1 + 1, 3): bl.data.energy = 3e5 * random.uniform(0.6, 1.2); bl.data.keyframe_insert('energy', frame=f)
    smoke_b = volume_box('breach_smoke', BX + V((0, 4, 14)), (24, 20, 30), density=0.5, color=(0.22, 0.2, 0.18), noise_scale=1.8, animate_w=(0, 3, F0, F1))
    key(smoke_b, 'scale', BREACH, (0.01,) * 3); key(smoke_b, 'scale', BREACH + 30, (12, 10, 15))
    for k in range(30):  # flying debris from the blast
        d = sphere(BX, random.uniform(0.15, 0.4), steel, segs=6, name='shrap'); v = V((random.uniform(-1, 1), random.uniform(-0.2, 1), random.uniform(0.3, 1.4))) * random.uniform(8, 18)
        key(d, 'location', BREACH, BX)
        for i in range(1, 6): t = i * 4 / 24; key(d, 'location', BREACH + i * 4, BX + v * t + V((0, 0, -4.9 * t * t)))
    # IGNITION: flame + light + billowing exhaust; lift-off begins
    flames = []
    for k, ob in enumerate([o for o in ship if o.name.startswith('bell')]):
        p = ob.location.copy()
        fl = cyl(p + V((0, 0, -9)), 1.9, 14, flame_m, verts=20, r2=0.3, rot=(math.pi, 0, 0), name='flame'); fl.parent = ship_root; flames.append(fl)
        co = cyl(p + V((0, 0, -5)), 0.8, 6, core_m, verts=12, r2=0.1, rot=(math.pi, 0, 0), name='core'); co.parent = ship_root; flames.append(co)
    for fl in flames:
        key(fl, 'scale', IGN - 1, (0.01, 0.01, 0.01)); key(fl, 'scale', IGN + 4, (0.8, 0.8, 0.6)); key(fl, 'scale', IGN + 14, (1.1, 1.1, 1.4))
        for f in range(IGN + 16, F1 + 1, 2): s_ = random.uniform(0.95, 1.12); fl.scale = (s_, s_, random.uniform(1.3, 1.6)); fl.keyframe_insert('scale', frame=f)
    il = light('POINT', (0, 0, Z0 - 2), 0, (1.0, 0.7, 0.4), size=6, name='ign_light'); il.parent = ship_root
    for f, e in [(IGN - 1, 0), (IGN + 6, 6e6), (F1, 9e6)]: il.data.energy = e; il.data.keyframe_insert('energy', frame=f)
    for k, sx in enumerate((-1, 1)):  # exhaust clouds rolling out of the flame trench
        ex = volume_box('exhaust%d' % k, (sx * 26, 0, 8), (40, 46, 24), density=1.4, color=(0.85, 0.82, 0.78), noise_scale=1.6, animate_w=(k, k + 2, F0, F1))
        key(ex, 'scale', IGN, (0.01, 0.01, 0.01)); key(ex, 'location', IGN, (sx * 4, 0, 6)); key(ex, 'scale', F1, (25, 23, 14)); key(ex, 'location', F1, (sx * 34, 0, 12))
    key(ship_root, 'location', LIFT, (0, 0, 0)); key(ship_root, 'location', F1, (0, 0, 9)); ship_root.animation_data.action.fcurves[0].keyframe_points[0].interpolation = 'QUAD'
    # camera at the fence, handheld; shakes after the breach and harder at ignition
    cam = camera((20, FY + 8, 2.0), (0, 0, 40), lens=28)
    base_loc = V((20, FY + 8, 2.0))
    for f in range(F0, F1 + 1, 2):
        amp = 0.02 + (0.12 * max(0, 1 - (f - BREACH) / 20) if f >= BREACH else 0) + (0.07 * min(1, (f - IGN) / 10) if f >= IGN else 0)
        cam.location = base_loc + V((random.gauss(0, amp), random.gauss(0, amp) * 0.5, random.gauss(0, amp))) + V((0, (f - F0) * 0.02, 0)); cam.keyframe_insert('location', frame=f)
        look_at(cam, (-8 + f * 0.03, 0, 34 + f * 0.04)); cam.rotation_euler.y += random.gauss(0, amp * 0.05); cam.keyframe_insert('rotation_euler', frame=f)

render({'wide': 'padwide', 'close': 'padclose', 'ignition': 'ignition'}[CAM], F0, F1)
