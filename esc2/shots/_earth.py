# shared procedural Earth materials (exec'd by shot scripts)
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

