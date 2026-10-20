# SHOT 2 (3.0–12.0s, 216 frames) — observation deck: riveted port window, night-side Earth, sunrise over the limb, haze + light shafts.
import sys, os, math, random
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import bpy, blib
from blib import *

sc = setup(world_color=(0, 0, 0), world_strength=0)
F0, F1 = 1, 216

# ---------- Earth (procedural, EEVEE) ----------
def earth_material():
    m = bpy.data.materials.new('earth'); m.use_nodes = True; nt = m.node_tree; b = nt.nodes['Principled BSDF']; L = nt.links.new
    tc = nt.nodes.new('ShaderNodeTexCoord')
    n1 = nt.nodes.new('ShaderNodeTexNoise'); n1.inputs['Scale'].default_value = 2.6; n1.inputs['Detail'].default_value = 14; n1.inputs['Roughness'].default_value = 0.62; L(tc.outputs['Generated'], n1.inputs['Vector'])
    land = nt.nodes.new('ShaderNodeValToRGB'); land.color_ramp.elements[0].position = 0.5; land.color_ramp.elements[1].position = 0.53; L(n1.outputs['Fac'], land.inputs['Fac'])
    n2 = nt.nodes.new('ShaderNodeTexNoise'); n2.inputs['Scale'].default_value = 9; n2.inputs['Detail'].default_value = 10; L(tc.outputs['Generated'], n2.inputs['Vector'])
    lc = nt.nodes.new('ShaderNodeValToRGB'); lc.color_ramp.elements[0].color = (0.05, 0.07, 0.025, 1); lc.color_ramp.elements[1].color = (0.32, 0.22, 0.12, 1); L(n2.outputs['Fac'], lc.inputs['Fac'])
    mix = nt.nodes.new('ShaderNodeMix'); mix.data_type = 'RGBA'; mix.inputs['A'].default_value = (0.004, 0.018, 0.05, 1); L(land.outputs['Color'], mix.inputs['Factor']); L(lc.outputs['Color'], mix.inputs['B']); L(mix.outputs['Result'], b.inputs['Base Color'])
    rough = nt.nodes.new('ShaderNodeMapRange'); rough.inputs['To Min'].default_value = 0.18; rough.inputs['To Max'].default_value = 0.85; L(land.outputs['Color'], rough.inputs['Value']); L(rough.outputs['Result'], b.inputs['Roughness'])
    # city lights only where it is dark: Shader-to-RGB of a diffuse = how lit this point is
    dif = nt.nodes.new('ShaderNodeBsdfDiffuse'); s2r = nt.nodes.new('ShaderNodeShaderToRGB'); L(dif.outputs[0], s2r.inputs[0])
    dark = nt.nodes.new('ShaderNodeMapRange'); dark.inputs['From Min'].default_value = 0.0; dark.inputs['From Max'].default_value = 0.05; dark.inputs['To Min'].default_value = 1.0; dark.inputs['To Max'].default_value = 0.0; L(s2r.outputs['Color'], dark.inputs['Value'])
    n3 = nt.nodes.new('ShaderNodeTexNoise'); n3.inputs['Scale'].default_value = 11; n3.inputs['Detail'].default_value = 3; L(tc.outputs['Generated'], n3.inputs['Vector'])
    cm = nt.nodes.new('ShaderNodeValToRGB'); cm.color_ramp.elements[0].position = 0.62; cm.color_ramp.elements[1].position = 0.72; L(n3.outputs['Fac'], cm.inputs['Fac'])
    n4 = nt.nodes.new('ShaderNodeTexNoise'); n4.inputs['Scale'].default_value = 420; n4.inputs['Detail'].default_value = 2; L(tc.outputs['Generated'], n4.inputs['Vector'])
    pin = nt.nodes.new('ShaderNodeValToRGB'); pin.color_ramp.elements[0].position = 0.62; pin.color_ramp.elements[1].position = 0.7; L(n4.outputs['Fac'], pin.inputs['Fac'])
    m1 = nt.nodes.new('ShaderNodeMath'); m1.operation = 'MULTIPLY'; L(cm.outputs['Color'], m1.inputs[0]); L(pin.outputs['Color'], m1.inputs[1])
    m2 = nt.nodes.new('ShaderNodeMath'); m2.operation = 'MULTIPLY'; L(m1.outputs[0], m2.inputs[0]); L(land.outputs['Color'], m2.inputs[1])
    m3 = nt.nodes.new('ShaderNodeMath'); m3.operation = 'MULTIPLY'; L(m2.outputs[0], m3.inputs[0]); L(dark.outputs['Result'], m3.inputs[1])
    m4 = nt.nodes.new('ShaderNodeMath'); m4.operation = 'MULTIPLY'; m4.inputs[1].default_value = 9.0; L(m3.outputs[0], m4.inputs[0])
    b.inputs['Emission Color'].default_value = (1.0, 0.55, 0.22, 1); L(m4.outputs[0], b.inputs['Emission Strength'])
    return m
def clouds_material():
    m = bpy.data.materials.new('clouds'); m.use_nodes = True; nt = m.node_tree; b = nt.nodes['Principled BSDF']; L = nt.links.new; m.blend_method = 'BLEND'; m.shadow_method = 'NONE'
    tc = nt.nodes.new('ShaderNodeTexCoord'); n = nt.nodes.new('ShaderNodeTexNoise'); n.inputs['Scale'].default_value = 5.5; n.inputs['Detail'].default_value = 12; n.inputs['Distortion'].default_value = 0.4; L(tc.outputs['Generated'], n.inputs['Vector'])
    cr = nt.nodes.new('ShaderNodeValToRGB'); cr.color_ramp.elements[0].position = 0.52; cr.color_ramp.elements[1].position = 0.72; L(n.outputs['Fac'], cr.inputs['Fac']); L(cr.outputs['Color'], b.inputs['Alpha'])
    b.inputs['Base Color'].default_value = (0.9, 0.9, 0.92, 1); b.inputs['Roughness'].default_value = 0.9; return m
def atmo_material():
    m = bpy.data.materials.new('atmo'); m.use_nodes = True; nt = m.node_tree; L = nt.links.new; m.blend_method = 'BLEND'; m.shadow_method = 'NONE'
    for n in list(nt.nodes): nt.nodes.remove(n)
    lw = nt.nodes.new('ShaderNodeLayerWeight'); lw.inputs['Blend'].default_value = 0.12
    pw = nt.nodes.new('ShaderNodeMath'); pw.operation = 'POWER'; pw.inputs[1].default_value = 2.2; L(lw.outputs['Facing'], pw.inputs[0])
    dif = nt.nodes.new('ShaderNodeBsdfDiffuse'); s2r = nt.nodes.new('ShaderNodeShaderToRGB'); L(dif.outputs[0], s2r.inputs[0])
    lit = nt.nodes.new('ShaderNodeMapRange'); lit.inputs['From Max'].default_value = 0.02; lit.inputs['To Min'].default_value = 0.05; L(s2r.outputs['Color'], lit.inputs['Value'])
    k = nt.nodes.new('ShaderNodeMath'); k.operation = 'MULTIPLY'; L(pw.outputs[0], k.inputs[0]); L(lit.outputs['Result'], k.inputs[1])
    em = nt.nodes.new('ShaderNodeEmission'); em.inputs[0].default_value = (0.25, 0.5, 1.0, 1); em.inputs[1].default_value = 7.0
    tr = nt.nodes.new('ShaderNodeBsdfTransparent'); mx = nt.nodes.new('ShaderNodeMixShader'); L(k.outputs[0], mx.inputs[0]); L(tr.outputs[0], mx.inputs[1]); L(em.outputs[0], mx.inputs[2])
    o = nt.nodes.new('ShaderNodeOutputMaterial'); L(mx.outputs[0], o.inputs[0]); return m

R = 60; EC = (0, 92, -66)
earth = sphere(EC, R, earth_material(), segs=192, name='earth')
clouds = sphere(EC, R * 1.008, clouds_material(), segs=128, name='clouds')
atmo = sphere(EC, R * 1.022, atmo_material(), segs=128, name='atmo')
for o, sp in ((earth, 0.006), (clouds, 0.009)): key(o, 'rotation_euler', F0, (0.4, 0, 0.3)); key(o, 'rotation_euler', F1, (0.4, 0, 0.3 + sp * (F1 - F0) / 24)); linear(o)
# sun: emissive disc behind the limb that rises + sun lamp
sun_disc = sphere((0, 520, -60), 6, emission('sun', (1.0, 0.92, 0.8), 400), segs=32, name='sun_disc')
key(sun_disc, 'location', F0, (4, 520, -40)); key(sun_disc, 'location', F1, (4, 520, -14)); ease_all(sun_disc)
sun = light('SUN', (0, 0, 0), 14.0, (1.0, 0.82, 0.62), size=0.01, name='sun')
key(sun, 'rotation_euler', F0, (math.radians(-94), 0, 0)); key(sun, 'rotation_euler', F1, (math.radians(-91), 0, 0)); ease_all(sun)
bpy.data.worlds['World'].node_tree.nodes['Background'].inputs[0].default_value = (0, 0, 0, 1)
# stars
star_m = emission('star', (0.9, 0.93, 1.0), 6)
for i in range(260):
    a = random.uniform(-1.1, 1.1); e = random.uniform(-0.05, 0.6); d = 900
    s = sphere((math.sin(a) * d, math.cos(a) * d, math.sin(e) * d), random.uniform(0.25, 0.9), star_m, segs=6, name='star')

# ---------- the room ----------
hull = grime_metal('hull', (0.15, 0.155, 0.16), 0.75, (0.3, 0.75), 3)
trim = grime_metal('trim', (0.32, 0.3, 0.27), 0.9, (0.2, 0.5), 9)
dark = grime_metal('dark', (0.05, 0.05, 0.055), 0.6, (0.4, 0.8), 5)
WY = 3.0; OW, OH = 4.4, 2.5
box((0, WY, 1.25 + OH / 2 + 1.0), (12, 0.5, 2.0), hull)               # wall above
box((0, WY, -1.25 - 1.0), (12, 0.5, 2.0 + 0.0), hull)                  # wall below
box((-(OW / 2 + 2.5), WY, 0), (5, 0.5, OH), hull); box((OW / 2 + 2.5, WY, 0), (5, 0.5, OH), hull)
# heavy frame + bolts
for (x, z, sx, sz) in ((0, OH / 2 + 0.17, OW + 0.68, 0.34), (0, -OH / 2 - 0.17, OW + 0.68, 0.34), (-OW / 2 - 0.17, 0, 0.34, OH), (OW / 2 + 0.17, 0, 0.34, OH)):
    box((x, WY - 0.33, z), (sx, 0.3, sz), trim, name='frame')
bolt_m = grime_metal('bolt', (0.4, 0.38, 0.34), 0.95, (0.15, 0.4), 20)
for i in range(13):
    x = -OW / 2 + i * OW / 12
    for z in (OH / 2 + 0.17, -OH / 2 - 0.17): cyl((x, WY - 0.5, z), 0.045, 0.06, bolt_m, rot=(math.pi / 2, 0, 0), verts=12, name='bolt')
for i in range(7):
    z = -OH / 2 + i * OH / 6
    for x in (-OW / 2 - 0.17, OW / 2 + 0.17): cyl((x, WY - 0.5, z), 0.045, 0.06, bolt_m, rot=(math.pi / 2, 0, 0), verts=12, name='bolt')
# glass: faint reflective sheet with condensation
# (no glass sheet: an alpha-blended pane under EEVEE volumetrics rendered a hard square around the sun)
# side walls, ceiling, floor with pipes
box((-3.2, 0, 0), (0.3, 7, 6), hull); box((3.2, 0, 0), (0.3, 7, 6), hull); box((0, 0, 2.6), (7, 7, 0.3), dark); box((0, 0, -2.1), (7, 7, 0.3), dark)
pipe = grime_metal('pipe', (0.22, 0.2, 0.17), 0.85, (0.3, 0.6), 12)
for k, (x, z) in enumerate(((-2.6, 2.1), (-2.2, 2.25), (2.5, 2.15), (2.8, 1.6))): cyl((x, 0, z), 0.09 + 0.03 * k, 7, pipe, rot=(math.pi / 2, 0, 0), verts=20, name='pipe')
# console in the foreground with a CRT and indicator lights
box((0, -0.2, -1.55), (3.4, 1.2, 0.8), dark, name='console'); box((0, 0.15, -1.05), (3.4, 0.6, 0.25), trim, rot=(math.radians(-25), 0, 0), name='console_top')
crt_m = emission('crt', (0.25, 1.0, 0.45), 0.07); box((-1.35, 0.3, -0.9), (0.3, 0.05, 0.2), crt_m, rot=(math.radians(-25), 0, 0), name='crt')
for i in range(10):
    c = (1.0, 0.55, 0.15) if i % 3 else (1.0, 0.15, 0.1)
    box((0.2 + i * 0.12, 0.12, -0.93), (0.05, 0.04, 0.03), emission(f'ind{i}', c, 6 if (i * 7) % 5 else 1), rot=(math.radians(-25), 0, 0), name='led')
# practical lights + haze inside the room
light('POINT', (-2.4, -1.5, 1.8), 60, (1.0, 0.5, 0.18), size=0.2, name='amber'); light('POINT', (2.6, 0.5, 1.9), 35, (1.0, 0.45, 0.15), size=0.2, name='amber2'); light('AREA', (0, 2.2, 0), 30, (1.0, 0.8, 0.6), rot=(math.radians(90), 0, 0), size=4, name='port_spill'); light('POINT', (1.0, -0.2, -0.8), 4, (0.3, 1.0, 0.5), size=0.2, name='crt_glow')
for o in bpy.data.objects:
    if o.name in ('port_spill', 'crt_glow', 'amber2'): o.data.volume_factor = 0.0
sun.data.volume_factor = 0.35
volume_box('haze', (0, 0, 0.2), (6.2, 6.6, 4.6), density=0.075, color=(0.85, 0.82, 0.8), noise_scale=1.2, aniso=0.55, animate_w=(0, 0.6, F0, F1))

# ---------- camera: slow push toward the port ----------
sc.eevee.volumetric_tile_size = '8'
cam = camera((0.0, -2.6, 0.05), (0, 10, -0.75), lens=28)
key(cam, 'location', F0, (0.15, -2.7, 0.05)); key(cam, 'location', F1, (-0.05, -1.55, 0.1)); ease_all(cam)
render('window', F0, F1)
