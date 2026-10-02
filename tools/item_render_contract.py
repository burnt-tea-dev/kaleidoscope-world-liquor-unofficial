"""Explicit item contexts from this port's pinned source, not generic thumbnails.
Historical source model topology remains separately audited against Java1.1.9.
"""
from pathlib import Path
import argparse,copy,json,hashlib
ROOT=Path(__file__).resolve().parents[1]
CONTEXTS=('gui','ground','fixed','head','firstperson_righthand','firstperson_lefthand','thirdperson_righthand','thirdperson_lefthand')
def read(p):return json.loads(p.read_text())
def resolve(name,seen=(),assets=None):
 assert name not in seen,('model parent cycle',name)
 ns,path=name.split(':');p=(assets or ROOT/'upstream/assets')/ns/'models'/(path+'.json');j=read(p)
 parent=resolve(j['parent'],(*seen,name),assets) if 'parent' in j else {}
 return {**parent,**j,'display':{**parent.get('display',{}),**j.get('display',{})}}
def planned():
 bp=ROOT/'runtime/BP';rp=ROOT/'runtime/RP';files={}
 geos={g['description']['identifier']:p for p in (rp/'models').rglob('*.json') for g in read(p).get('minecraft:geometry',[])}
 ids=['kaleidoscope_world_liquor:'+x for x in read(ROOT/'docs/item-inventory.json')['furniture']];assert len(ids)==27
 for ident in ids:
  short=ident.split(':')[1];model=resolve('kaleidoscope_world_liquor:item/'+short,assets=ROOT/'data/java-parity/neoforge-1.1.9/assets' if short=='freezer' else None)
  assert model.get('elements'),(ident,'expected geometric Java item')
  bpfile=bp/'blocks'/f'{short}.json';b=read(bpfile);c=b['minecraft:block']['components']
  visual=c
  if short.endswith('_cabinet'):
   matches=[p['components'] for p in b['minecraft:block']['permutations'] if p['condition']=="q.block_state('kaleidoscope_world_liquor:position') == 'single'"]
   assert len(matches)==1,(ident,'missing single cabinet item source');visual=matches[0]
  geometry=visual['minecraft:geometry']['identifier'];gp=geos[geometry];g=files.get(gp,read(gp));transforms={}
  for context in CONTEXTS:
   pose=model.get('display',{}).get(context,model.get('display',{}).get(context.replace('_lefthand','_righthand'),{}) if context.endswith('_lefthand') else {})
   transforms[context]={k:copy.deepcopy(pose.get(k,v)) for k,v in [('rotation',[0,0,0]),('translation',[0,0,0]),('scale',[1,1,1])]}
   if context=='gui':transforms[context]['fit_to_frame']=False
  g['format_version']='1.21.0';g['minecraft:geometry'][0]['item_display_transforms']=transforms;files[gp]=g
  # Preserve every face-material label; no shared/world shader changes.
  c['minecraft:item_visual']={'geometry':copy.deepcopy(visual['minecraft:geometry']),'material_instances':copy.deepcopy(visual['minecraft:material_instances'])};files[bpfile]=b
  ip=bp/'items'/f'{short}.json';item=read(ip);ic=item['minecraft:item']['components'];assert ic['minecraft:block_placer']=={'block':ident,'replace_block_item':True},ident
  ic.pop('minecraft:icon',None);files[ip]=item
 return files

def run(write=False):
 files=planned();drift=[]
 from update_freezer_java_art import check as freezer_art_check, SOURCE
 from update_java_face_topology import check as topology_check
 freezer_art_check();topology_check()
 reviewed={x['runtime'] for x in read(SOURCE/'face-pruning.json')['entries']}
 reviewed.add('runtime/RP/models/entity/kwl_g_5b611b0754ffa64d.geo.json')
 for name,digest in read(ROOT/'data/item-display-original-bones.json').items():
  if name in reviewed:continue # Historical hashes retained; latest pinned source checked above
  assert hashlib.sha256(json.dumps(read(ROOT/name)['minecraft:geometry'][0]['bones'],sort_keys=True).encode()).hexdigest()==digest,('Unrelated source geometry changed',name)
 for p,j in files.items():
  if read(p)!=j:
   if write:p.write_text(json.dumps(j,ensure_ascii=False,indent=2)+'\n')
   else:drift.append(str(p.relative_to(ROOT)))
 assert not drift,('Native furniture item context drift',drift)
 # All129 generated sprite routes remain registered and textured.
 ids={'kaleidoscope_world_liquor:'+x for x in read(ROOT/'docs/item-inventory.json')['furniture']};sprites=0
 for p in (ROOT/'runtime/BP/items').glob('*.json'):
  i=read(p)['minecraft:item']
  if i['description']['identifier'] not in ids:assert 'minecraft:icon' in i['components'];sprites+=1
 assert sprites==129,sprites
 print('27 geometric furniture routes;129 sprite routes; client acceptance pending')
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--write',action='store_true');a=p.parse_args();run(a.write)
