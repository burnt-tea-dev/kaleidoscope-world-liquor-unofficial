#!/usr/bin/env python3
"""Convert four reviewed current-author cups without rebuilding other assets.

The archive identity and exact selected source members are recorded in
data/current-author-review-20261009.json. Original Java rotation, rescale and
UVs pass through the existing converter; the host's documented drink-sheet
separation remains an explicit Bedrock rendering adapter, not client proof.
"""
import argparse, hashlib, json, math, os, sys, tempfile
from pathlib import Path
from PIL import Image
import java_geometry as geo

ROOT=Path(__file__).resolve().parents[1]
TAV=Path(os.environ.get('TAVERN_ROOT',str(ROOT.parent/'tavern-src')))
NS='kaleidoscope_world_liquor'
ART={
 'around_the_world':'987bf61b8661fdfa',
 'jerk':'d17bbb0c984a1424',
 'long_island_iced_tea':'5f317f0af7de6211',
 'shrimp_cocktail':'a21c149365149f85',
}

def planned(out):
 sys.path.insert(0,str(TAV/'tools'))
 from repair_drink_planes import repair_geometry
 review=json.loads((ROOT/'data/current-author-review-20261009.json').read_text())
 for name,digest in review['selected_source_members'].items():
  assert hashlib.sha256((ROOT/'upstream'/name).read_bytes()).hexdigest()==digest,('Author source changed',name)
 files={};rows=[]
 for name,identity in ART.items():
  model=geo.resolve_model(NS+':block/mixology/'+name)
  source_elements=len(model['elements'])
  for element in model['elements']:
   rotation=element.get('rotation',{})
   if rotation.get('rescale'):
    scale=1/math.cos(math.radians(rotation['angle']));axis='xyz'.index(rotation['axis']);pivot=rotation['origin']
    for edge in ['from','to']:
     element[edge]=[value if index==axis else pivot[index]+(value-pivot[index])*scale for index,value in enumerate(element[edge])]
    rotation['rescale']=False
  model,inward=geo.lower_mixed_axis_surfaces(model)
  model,uv=geo.lower_uv_half_turns(model,allow_quarter_turns=True)
  atlas=out/(name+'.png');placement=geo.build_atlas(model,atlas)
  doc=geo.geometry(model,name,placement,[[0,0]],allow_native_uv_rotation=True)
  doc['minecraft:geometry'][0]['description']['identifier']='geometry.kwl.g_'+identity
  for bone in doc['minecraft:geometry'][0]['bones']:
   for cube in bone.get('cubes',[]):
    for face in cube['uv'].values():face['material_instance']='default'
  separated=repair_geometry(doc)
  files[ROOT/f'runtime/RP/models/entity/kwl_g_{identity}.geo.json']=(json.dumps(doc,ensure_ascii=False,indent=2)+'\n').encode()
  files[ROOT/f'runtime/RP/textures/kwl/generated/{NS}__block__mixology__{name}.png']=atlas.read_bytes()
  block=json.loads((ROOT/f'runtime/BP/blocks/cup_{name}.json').read_text())['minecraft:block']['components']
  assert block['minecraft:geometry']['identifier']==doc['minecraft:geometry'][0]['description']['identifier']
  assert all(row['texture']==f'kwl_{NS}__block__mixology__{name}' for row in block['minecraft:material_instances'].values())
  rows.append({'item':NS+':'+name,'source_elements':source_elements,'lowered_elements':len(model['elements']),'inward_surface_adaptations':inward,'uv_lowering':uv,'separated_drink_faces':separated})
 for name in ['around_the_world','jerk']:
  files[ROOT/f'runtime/RP/textures/kwl/items/{name}.png']=(ROOT/f'upstream/assets/{NS}/textures/item/{name}.png').read_bytes()
 return files,rows

def main():
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--write',action='store_true');args=parser.parse_args()
 with tempfile.TemporaryDirectory(prefix='world-liquor-author-art-') as temp:
  files,rows=planned(Path(temp))
  for path,data in files.items():
   if args.write:path.write_bytes(data)
   elif path.suffix=='.png':
    import io
    expected=Image.open(io.BytesIO(data)).convert('RGBA');actual=Image.open(path).convert('RGBA')
    assert expected.size==actual.size and expected.tobytes()==actual.tobytes(),('Current author pixels not exported',path)
   else:assert json.loads(path.read_bytes())==json.loads(data),('Current author topology/UV not exported',path)
 print(json.dumps({'source':'NeoForge1.1.11 CF9066406 / Forge1.1.12 CF9066402','cups':rows,'authored_inventory_icons':2,'client':False},ensure_ascii=False))
if __name__=='__main__':main()
