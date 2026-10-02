"""Localized, hash-pinned freezer art conversion. Never runs the full port builder."""
from pathlib import Path
import argparse,copy,hashlib,json,importlib.util,os
from PIL import Image
import java_geometry as java
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'data/java-parity/neoforge-1.1.9'
FILES={'fridge_close':'kwl_g_5b611b0754ffa64d.geo.json','fridge_open':'kwl_g_7c341bb644967296.geo.json'}
DESCRIPTIONS={short:{'identifier':'geometry.kwl.'+filename.removeprefix('kwl_').removesuffix('.geo.json'),'texture_width':128,'texture_height':128,'visible_bounds_width':4,'visible_bounds_height':4,'visible_bounds_offset':[0,1,0]} for short,filename in FILES.items()}
def read(p):return json.loads(p.read_text())
def verify_source():
 for path,expected in read(SOURCE/'source.json')['files'].items():
  assert hashlib.sha256((SOURCE/path).read_bytes()).hexdigest()==expected,('source changed',path)
def converted(short):
 verify_source();p=ROOT/'runtime/RP/models/entity'/FILES[short];old=read(p)
 assert old['minecraft:geometry'][0]['description']==DESCRIPTIONS[short],('Freezer identity/texture dimensions/bounds drift',short)
 model=java.resolve_model('kaleidoscope_world_liquor:block/'+short,SOURCE/'assets');model,changes=java.lower_uv_half_turns(model,allow_quarter_turns=True)
 output=java.geometry(model,old['minecraft:geometry'][0]['description']['identifier'].removeprefix('geometry.kwl.'),{'kaleidoscope_world_liquor:block/fridge':{'x':0,'y':0,'width':128,'height':128}},[[0,0]],allow_native_uv_rotation=True)
 output['format_version']='1.21.0';g=output['minecraft:geometry'][0];g['description']=copy.deepcopy(DESCRIPTIONS[short])
 if 'item_display_transforms' in old['minecraft:geometry'][0]:g['item_display_transforms']=copy.deepcopy(old['minecraft:geometry'][0]['item_display_transforms'])
 for bone in g['bones']:
  for cube in bone.get('cubes',[]):
   for face in cube['uv'].values():face['material_instance']='default'
 return output

def check(write=False,thumbnail=False):
 verify_source()
 for short,name in FILES.items():
  target=ROOT/'runtime/RP/models/entity'/name;want=converted(short)
  png=ROOT/f'runtime/RP/textures/kwl/generated/kaleidoscope_world_liquor__block__{short}.png';original=(SOURCE/'assets/kaleidoscope_world_liquor/textures/block/fridge.png').read_bytes()
  if write:target.write_text(json.dumps(want,ensure_ascii=False,indent=2)+'\n');png.write_bytes(original)
  else:assert read(target)==want,('freezer conversion drift',short);assert png.read_bytes()==original,('freezer atlas drift',short)
 if thumbnail:
  assert write
  tav=Path(os.environ.get('TAVERN_ROOT',str(ROOT.parent/'tavern-guide')))
  spec=importlib.util.spec_from_file_location('preview',tav/'art/tools/render_preview.py');mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
  # This remains an explicitly approximate guide preview, not a native GUI screenshot.
  faces=mod.all_faces(mod.decode_geo(converted('fridge_close')))
  img=mod.raster(faces,Image.open(SOURCE/'assets/kaleidoscope_world_liquor/textures/block/fridge.png'),size=96,yaw=35,pitch=25,cull=True)
  img.save(ROOT/'runtime/RP/textures/kwl/items/freezer.png')
 print('Pinned1.1.9 freezer art matches source; client rendering unverified')
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--write',action='store_true');p.add_argument('--thumbnail',action='store_true');a=p.parse_args();check(a.write,a.thumbnail)
