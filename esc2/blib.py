# ESCAPE VELOCITY · EP01 (Blender remake) — shared helpers for the shot scripts.
# Industrial "cassette-futurism" look: dark wet metal, amber practicals, haze, AgX High Contrast, EEVEE volumetrics + bloom.
# Usage inside a shot script:   import blib; blib.setup(); ...build...; blib.render(shot_name, f0, f1)
# CLI:  blender -b --python esc2/shots/<shot>.py -- [--test FRAME] [--frames A-B] [--res 1280x720]
import bpy, math, random, sys, os

ARGS = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
def arg(name, default=None):
    return ARGS[ARGS.index(name) + 1] if name in ARGS else default
ROOT = os.path.dirname(os.path.abspath(__file__))
FPS = 24

def setup(world_color=(0.0, 0.0, 0.0), world_strength=1.0, haze=0.0, haze_color=(0.6, 0.6, 0.65)):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = 'BLENDER_EEVEE'
    e = sc.eevee
    e.taa_render_samples = 12
    e.use_bloom = True; e.bloom_intensity = 0.06; e.bloom_threshold = 0.9; e.bloom_radius = 6.5
    e.use_volumetric_lights = True; e.use_volumetric_shadows = True; e.volumetric_tile_size = '16'; e.volumetric_samples = 32; e.volumetric_end = 400
    e.use_soft_shadows = True; e.shadow_cube_size = '1024'; e.shadow_cascade_size = '2048'
    e.use_gtao = True; e.gtao_distance = 1.5; e.use_ssr = True; e.use_ssr_refraction = False
    e.use_motion_blur = True; e.motion_blur_shutter = 0.5
    sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'AgX - Punchy'
    sc.render.fps = FPS
    res = arg('--res', '1280x720').split('x'); sc.render.resolution_x, sc.render.resolution_y = int(res[0]), int(res[1]); sc.render.resolution_percentage = 100
    sc.render.image_settings.file_format = 'PNG'; sc.render.image_settings.color_mode = 'RGB'
    w = bpy.data.worlds.new('World'); sc.world = w; w.use_nodes = True
    nt = w.node_tree; bg = nt.nodes['Background']; bg.inputs[0].default_value = (*world_color, 1); bg.inputs[1].default_value = world_strength
    if haze > 0:
        vol = nt.nodes.new('ShaderNodeVolumePrincipled'); vol.inputs['Density'].default_value = haze; vol.inputs['Color'].default_value = (*haze_color, 1); vol.inputs['Anisotropy'].default_value = 0.55
        nt.links.new(vol.outputs[0], nt.nodes['World Output'].inputs['Volume'])
    random.seed(2147)
    return sc

# ---------- materials ----------
def mat(name, color=(0.5, 0.5, 0.5), metal=0.0, rough=0.5, emit=None, emit_strength=0.0, alpha=1.0):
    m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*color, 1); b.inputs['Metallic'].default_value = metal; b.inputs['Roughness'].default_value = rough
    if emit is not None: b.inputs['Emission Color'].default_value = (*emit, 1); b.inputs['Emission Strength'].default_value = emit_strength
    if alpha < 1: b.inputs['Alpha'].default_value = alpha; m.blend_method = 'BLEND'
    return m

def grime_metal(name, color=(0.18, 0.19, 0.2), metal=0.85, rough=(0.25, 0.7), scale=6.0):
    """metal with noise-driven roughness + subtle colour variation (wet/grimy)"""
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; b = nt.nodes['Principled BSDF']
    tc = nt.nodes.new('ShaderNodeTexCoord'); nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = scale; nz.inputs['Detail'].default_value = 8
    nt.links.new(tc.outputs['Object'], nz.inputs['Vector'])
    rr = nt.nodes.new('ShaderNodeMapRange'); rr.inputs['To Min'].default_value = rough[0]; rr.inputs['To Max'].default_value = rough[1]; nt.links.new(nz.outputs['Fac'], rr.inputs['Value']); nt.links.new(rr.outputs['Result'], b.inputs['Roughness'])
    cr = nt.nodes.new('ShaderNodeValToRGB'); cr.color_ramp.elements[0].color = (color[0] * 0.55, color[1] * 0.55, color[2] * 0.55, 1); cr.color_ramp.elements[1].color = (*color, 1)
    nt.links.new(nz.outputs['Fac'], cr.inputs['Fac']); nt.links.new(cr.outputs['Color'], b.inputs['Base Color']); b.inputs['Metallic'].default_value = metal
    return m

def emission(name, color, strength):
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree
    for n in list(nt.nodes): nt.nodes.remove(n)
    e = nt.nodes.new('ShaderNodeEmission'); e.inputs[0].default_value = (*color, 1); e.inputs[1].default_value = strength
    o = nt.nodes.new('ShaderNodeOutputMaterial'); nt.links.new(e.outputs[0], o.inputs[0]); return m

def window_grid(name, lit=(1.0, 0.75, 0.45), wall=(0.03, 0.03, 0.035), density=0.35, scale=(0.35, 0.22), strength=6.0, seed=0.0, axes=None):
    """building façade: brick texture used as a window grid, random cells lit"""
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; b = nt.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*wall, 1); b.inputs['Roughness'].default_value = 0.6
    tc = nt.nodes.new('ShaderNodeTexCoord'); mp = nt.nodes.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (scale[0], scale[0], scale[1]); mp.inputs['Location'].default_value = (seed, seed * 0.7, 0)
    if axes:  # pick which two object axes the 2D brick grid runs along (e.g. ('Y','Z') for a wall facing ±X)
        sp = nt.nodes.new('ShaderNodeSeparateXYZ'); cb = nt.nodes.new('ShaderNodeCombineXYZ'); nt.links.new(tc.outputs['Object'], sp.inputs[0])
        nt.links.new(sp.outputs[axes[0]], cb.inputs['X']); nt.links.new(sp.outputs[axes[1]], cb.inputs['Y']); nt.links.new(cb.outputs[0], mp.inputs['Vector'])
    else: nt.links.new(tc.outputs['Object'], mp.inputs['Vector'])
    br = nt.nodes.new('ShaderNodeTexBrick'); br.offset = 0.0; br.inputs['Mortar Size'].default_value = 0.35; br.inputs['Scale'].default_value = 1.0; br.inputs['Color1'].default_value = (1, 1, 1, 1); br.inputs['Color2'].default_value = (0, 0, 0, 1); br.inputs['Mortar'].default_value = (0, 0, 0, 1)
    br.inputs['Brick Width'].default_value = 1.0; br.inputs['Row Height'].default_value = 1.0
    nt.links.new(mp.outputs['Vector'], br.inputs['Vector'])
    # random on/off per cell: use brick's Fac (random per brick) thresholded
    # Color is a random grey per brick (mortar = 0), so thresholding it lights a random subset of whole cells
    bw = nt.nodes.new('ShaderNodeRGBToBW'); nt.links.new(br.outputs['Color'], bw.inputs[0])
    mask = nt.nodes.new('ShaderNodeMath'); mask.operation = 'GREATER_THAN'; mask.inputs[1].default_value = 1.0 - density; nt.links.new(bw.outputs[0], mask.inputs[0])
    em = nt.nodes.new('ShaderNodeMath'); em.operation = 'MULTIPLY'; em.inputs[1].default_value = strength; nt.links.new(mask.outputs[0], em.inputs[0])
    b.inputs['Emission Color'].default_value = (*lit, 1); nt.links.new(em.outputs[0], b.inputs['Emission Strength'])
    return m

def volume_box(name, loc, size, density=0.02, color=(0.7, 0.7, 0.75), noise_scale=0.0, aniso=0.4, animate_w=None):
    bpy.ops.mesh.primitive_cube_add(location=loc); o = bpy.context.object; o.name = name; o.scale = (size[0] / 2, size[1] / 2, size[2] / 2)
    m = bpy.data.materials.new(name + '_vol'); m.use_nodes = True; nt = m.node_tree; nt.nodes.remove(nt.nodes['Principled BSDF'])
    v = nt.nodes.new('ShaderNodeVolumePrincipled'); v.inputs['Color'].default_value = (*color, 1); v.inputs['Anisotropy'].default_value = aniso
    if noise_scale > 0:
        tc = nt.nodes.new('ShaderNodeTexCoord'); nz = nt.nodes.new('ShaderNodeTexNoise'); nz.noise_dimensions = '4D'; nz.inputs['Scale'].default_value = noise_scale; nz.inputs['Detail'].default_value = 4
        nt.links.new(tc.outputs['Object'], nz.inputs['Vector'])
        cr = nt.nodes.new('ShaderNodeMapRange'); cr.inputs['From Min'].default_value = 0.45; cr.inputs['From Max'].default_value = 0.75; cr.inputs['To Max'].default_value = density
        nt.links.new(nz.outputs['Fac'], cr.inputs['Value']); nt.links.new(cr.outputs['Result'], v.inputs['Density'])
        if animate_w:
            w = nz.inputs['W']; w.default_value = animate_w[0]; w.keyframe_insert('default_value', frame=animate_w[2]); w.default_value = animate_w[1]; w.keyframe_insert('default_value', frame=animate_w[3]); linear(m.node_tree)
    else: v.inputs['Density'].default_value = density
    nt.links.new(v.outputs[0], nt.nodes['Material Output'].inputs['Volume']); o.data.materials.append(m); return o

# ---------- objects ----------
def box(loc, size, material=None, rot=(0, 0, 0), name='box'):
    bpy.ops.mesh.primitive_cube_add(location=loc, rotation=rot); o = bpy.context.object; o.name = name; o.scale = (size[0] / 2, size[1] / 2, size[2] / 2)
    if material: o.data.materials.append(material)
    return o
def cyl(loc, r, depth, material=None, rot=(0, 0, 0), verts=32, name='cyl', r2=None):
    if r2 is None: bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=depth, location=loc, rotation=rot)
    else: bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r, radius2=r2, depth=depth, location=loc, rotation=rot)
    o = bpy.context.object; o.name = name
    if material: o.data.materials.append(material)
    bpy.ops.object.shade_smooth(); return o
def sphere(loc, r, material=None, segs=64, name='sphere'):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segs, ring_count=segs // 2, radius=r, location=loc); o = bpy.context.object; o.name = name
    if material: o.data.materials.append(material)
    bpy.ops.object.shade_smooth(); return o
def light(kind, loc, energy, color=(1, 1, 1), rot=(0, 0, 0), size=0.5, spot=None, name='light'):
    bpy.ops.object.light_add(type=kind, location=loc, rotation=rot); o = bpy.context.object; o.name = name; d = o.data; d.energy = energy; d.color = color
    if kind in ('POINT', 'SPOT', 'AREA'): d.shadow_soft_size = size
    if kind == 'SPOT' and spot: d.spot_size = spot[0]; d.spot_blend = spot[1]
    if kind == 'SUN': d.angle = size
    return o
def camera(loc, target, lens=35, name='cam'):
    bpy.ops.object.camera_add(location=loc); c = bpy.context.object; c.name = name; c.data.lens = lens; c.data.clip_end = 5000
    look_at(c, target); bpy.context.scene.camera = c; return c
def look_at(obj, target):
    import mathutils
    d = mathutils.Vector(target) - obj.location; obj.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
def key(obj, path, frame, value=None):
    if value is not None: setattr(obj, path, value)
    obj.keyframe_insert(path, frame=frame)
def linear(holder):
    ad = getattr(holder, 'animation_data', None)
    if ad and ad.action:
        for fc in ad.action.fcurves:
            for k in fc.keyframe_points: k.interpolation = 'LINEAR'
def ease_all(holder):
    ad = getattr(holder, 'animation_data', None)
    if ad and ad.action:
        for fc in ad.action.fcurves:
            for k in fc.keyframe_points: k.interpolation = 'BEZIER'; k.easing = 'AUTO'

def text_mesh(body, loc, size, material, rot=(math.pi / 2, 0, 0), font=None, align='CENTER', extrude=0.0):
    bpy.ops.object.text_add(location=loc, rotation=rot); o = bpy.context.object; o.data.body = body; o.data.size = size; o.data.align_x = align; o.data.extrude = extrude
    if font: o.data.font = bpy.data.fonts.load(font)
    o.data.materials.append(material); return o

FONTS = os.path.join(os.path.dirname(ROOT), 'fonts')
MONO = os.path.join(ROOT, 'JetBrainsMono.ttf'); SANS = os.path.join(ROOT, 'InterTight-normal.ttf')

# ---------- render ----------
def render(shot, f0, f1):
    sc = bpy.context.scene; sc.frame_start, sc.frame_end = f0, f1
    out = os.path.join(os.path.dirname(ROOT), 'out', 'esc2_frames', shot); os.makedirs(out, exist_ok=True)
    test = arg('--test'); rng = arg('--frames')
    if test is not None:
        f = int(test); sc.frame_set(f); sc.render.filepath = os.path.join(os.path.dirname(ROOT), 'out', 'esc2_tests', f'{shot}_{f:04d}.png'); os.makedirs(os.path.dirname(sc.render.filepath), exist_ok=True)
        bpy.ops.render.render(write_still=True); print('WROTE', sc.render.filepath); return
    if rng: a, b = map(int, rng.split('-')); sc.frame_start, sc.frame_end = a, b
    sc.render.use_overwrite = False; sc.render.use_placeholder = True
    sc.render.filepath = os.path.join(out, '#####'); bpy.ops.render.render(animation=True); print('DONE', shot)
