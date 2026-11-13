"""Independent element/UV checks against the pinned released Java models."""
import hashlib,json,unittest
from unittest.mock import patch
import update_freezer_java_art as converter
from pathlib import Path
from PIL import Image
from update_freezer_java_art import ROOT,SOURCE,FILES,check
class FreezerJavaArt(unittest.TestCase):
 def test_pinned_source(self):
  expected={'models/block/fridge_close.json':'18dcb49c782fc6f49f5538058f9ebe275eca83b1bac71dd09b916a3bfd557554','models/block/fridge_open.json':'281839ce3280f39ad091ee7022001dd10da1fec46a21cf0c1c5244ebdf421da0','textures/block/fridge.png':'d748ad292210d515e570b272703316f4c823bad5e786b13ca7824a12215c58dc'}
  for p,digest in expected.items():self.assertEqual(digest,hashlib.sha256((SOURCE/'assets/kaleidoscope_world_liquor'/p).read_bytes()).hexdigest())
 def test_each_authored_face_and_uv(self):
  for short,filename in FILES.items():
   java=json.loads((SOURCE/f'assets/kaleidoscope_world_liquor/models/block/{short}.json').read_text())
   raw=json.loads((ROOT/'runtime/RP/models/entity'/filename).read_text());self.assertEqual('1.21.0',raw['format_version'])
   cubes=[c for b in raw['minecraft:geometry'][0]['bones'] for c in b.get('cubes',[])]
   self.assertEqual(len(java['elements']),len(cubes));self.assertEqual(3 if short=='fridge_close' else 10,len(cubes))
   self.assertEqual(16 if short=='fridge_close' else 44,sum(len(c['uv']) for c in cubes))
   for e,c in zip(java['elements'],cubes):
    self.assertEqual([8-e['to'][0],e['from'][1],e['from'][2]-8],c['origin'])
    self.assertEqual([e['to'][i]-e['from'][i] for i in range(3)],c['size'])
    self.assertEqual(set(e['faces']),set(c['uv']))
    for side,f in e['faces'].items():
     u0,v0,u1,v1=[n*8 for n in f['uv']];rotation=f.get('rotation',0)
     if rotation==180:u0,v0,u1,v1=u1,v1,u0,v0;rotation=0
     if side in ('up','down'):u0,v0,u1,v1=u1,v1,u0,v0
     self.assertEqual([u0,v0],c['uv'][side]['uv']);self.assertEqual([u1-u0,v1-v0],c['uv'][side]['uv_size'])
     self.assertEqual(rotation,c['uv'][side].get('uv_rotation',0));self.assertEqual('default',c['uv'][side]['material_instance'])
 def test_closed_item_views_and_world_open(self):
  closed=json.loads((ROOT/'runtime/RP/models/entity'/FILES['fridge_close']).read_text())['minecraft:geometry'][0]
  self.assertEqual([10,-45,0],closed['item_display_transforms']['gui']['rotation'])
  self.assertEqual([.7,.7,.7],closed['item_display_transforms']['gui']['scale'])
  self.assertEqual([0,-180,0],closed['item_display_transforms']['fixed']['rotation'])
  opened=json.loads((ROOT/'runtime/RP/models/entity'/FILES['fridge_open']).read_text())['minecraft:geometry'][0];self.assertNotIn('item_display_transforms',opened)
 def test_exact_atlases_and_nonempty_guide(self):
  original=(SOURCE/'assets/kaleidoscope_world_liquor/textures/block/fridge.png').read_bytes()
  for s in FILES:self.assertEqual(original,(ROOT/f'runtime/RP/textures/kwl/generated/kaleidoscope_world_liquor__block__{s}.png').read_bytes())
  with Image.open(ROOT/'runtime/RP/textures/kwl/items/freezer.png') as img:self.assertEqual((96,96),img.size);self.assertIsNotNone(img.getchannel('A').getbbox())
 def test_dimension_and_bounds_mutations_rejected(self):
  original=converter.read;target=ROOT/'runtime/RP/models/entity'/FILES['fridge_close']
  for field in ['texture_width','visible_bounds_width']:
   def altered(p):
    j=original(p)
    if p==target:j['minecraft:geometry'][0]['description'][field]=999
    return j
   with self.subTest(field=field),patch.object(converter,'read',altered):
    with self.assertRaises(AssertionError):converter.check()
 def test_deterministic_conversion(self):check()
class SharedFreezerSprites(unittest.TestCase):
 def test_current_aliases_use_exact_fixed_surface(self):
  import freezer_ingredient_art as owner
  self.assertEqual(len(owner.normalize_shared_geometry()),4)
  shared=json.loads((ROOT/'runtime/RP/models/entity/freezer_blue_dye.geo.json').read_text())['minecraft:geometry'][0]
  for name in owner.SHARED_SPRITES:
   entity=json.loads((ROOT/f'runtime/RP/entity/freezer_{name}.entity.json').read_text())['minecraft:client_entity']['description']
   self.assertEqual(entity['geometry']['default'],shared['description']['identifier'])
   self.assertEqual(entity['textures']['default'],f'textures/repair/freezer_{name}')
   self.assertFalse((ROOT/f'runtime/RP/models/entity/freezer_{name}.geo.json').exists())
 def test_shared_shape_or_visible_route_mutations_rejected(self):
  import freezer_ingredient_art as owner
  original=owner.read
  cases=('bounds','texture_size','origin','size','pivot','bone','uv','material','texture','entity','controller')
  for field in cases:
   def altered(path):
    value=original(path)
    if path.name=='freezer_blue_dye.geo.json':
     g=value['minecraft:geometry'][0];bone=g['bones'][0];cube=bone['cubes'][0]
     if field=='bounds':g['description']['visible_bounds_width']+=1
     elif field=='texture_size':g['description']['texture_width']+=1
     elif field=='origin':cube['origin'][0]+=.1
     elif field=='size':cube['size'][0]+=.1
     elif field=='pivot':bone['pivot'][0]+=.1
     elif field=='bone':bone['name']='other'
     elif field=='uv':cube['uv']['up']['uv'][0]+=.1
    if path.name=='freezer_slime_ball.entity.json':
     d=value['minecraft:client_entity']['description']
     if field=='material':d['materials']['default']='entity_alphablend'
     elif field=='texture':d['textures']['default']='textures/repair/freezer_blue_dye'
     elif field=='entity':d['identifier']='changed:id'
     elif field=='controller':d['render_controllers']=['changed.controller']
    return value
   with self.subTest(field=field),patch.object(owner,'read',altered):
    with self.assertRaises(AssertionError):owner.normalize_shared_geometry()
 def test_normalization_is_idempotent_and_preserves_pixels(self):
  import tempfile,shutil
  import freezer_ingredient_art as owner
  with tempfile.TemporaryDirectory() as folder:
   root=Path(folder)
   paths=['runtime/RP/models/entity/freezer_blue_dye.geo.json','data/freezer-visual-additions.json']
   for name in owner.SHARED_SPRITES:
    paths.extend([f'runtime/RP/entity/freezer_{name}.entity.json',f'runtime/RP/render_controllers/freezer_{name}.json',f'runtime/RP/textures/repair/freezer_{name}.png',f'runtime/RP/textures/repair/freezer_{name}.texture_set.json'])
   for name in paths:
    target=root/name;target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(ROOT/name,target)
   for name in owner.SHARED_SPRITES:
    value=json.loads((root/paths[0]).read_text());value['minecraft:geometry'][0]['description']['identifier']=f'geometry.kwl.freezer_{name}'
    (root/f'runtime/RP/models/entity/freezer_{name}.geo.json').write_text(json.dumps(value))
    ep=root/f'runtime/RP/entity/freezer_{name}.entity.json';e=json.loads(ep.read_text());e['minecraft:client_entity']['description']['geometry']['default']=f'geometry.kwl.freezer_{name}';ep.write_text(json.dumps(e))
   owner.normalize_shared_geometry(write=True,root=root)
   before={p.relative_to(root):p.read_bytes() for p in root.rglob('*') if p.is_file()}
   owner.normalize_shared_geometry(write=True,root=root);owner.normalize_shared_geometry(root=root)
   self.assertEqual(before,{p.relative_to(root):p.read_bytes() for p in root.rglob('*') if p.is_file()})

if __name__=='__main__':unittest.main()
