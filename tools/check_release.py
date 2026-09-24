#!/usr/bin/env python3
"""Asset and progression audit; no interaction emulation."""
from pathlib import Path
import json,re
from PIL import Image
root=Path(__file__).resolve().parents[1];tav=root.parent/'tavern-src';bp=root/'runtime/BP';rp=root/'runtime/RP'
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
errors=[]
def check(ok,message):
 if not ok:errors.append(message)
for path in root.joinpath('runtime').rglob('*.json'):
 try:read(path)
 except Exception as e:errors.append(str(path)+': '+str(e))
geometry=set();owned_geometry=set()
for pack in [rp,tav/'runtime/RP']:
 for p in (pack/'models').rglob('*.json'):
  try:
   if pack==rp:
    check(p.parent in (pack/'models/blocks',pack/'models/entity'),p.name+': geometry is outside a client-scanned models directory')
   for g in read(p).get('minecraft:geometry',[]):
    identifier=g['description']['identifier'];geometry.add(identifier)
    if pack==rp:
     check(identifier not in owned_geometry,p.name+': duplicate geometry '+identifier)
     check(len(identifier)<=48,p.name+': geometry identifier is too long '+identifier)
     owned_geometry.add(identifier)
  except Exception as e:errors.append(str(p)+': '+str(e))
# Keep the combined pack compact. This count alone cannot prove client asset
# registration: a valid geometry under an arbitrary directory is still missed.
check(len(geometry)<1024,'combined Tavern + World Liquor geometry budget exceeded')
for p in (bp/'blocks').glob('*.json'):
 d=read(p)['minecraft:block'];check(all(len(values)<=16 for values in d['description'].get('states',{}).values()),p.name+': state has more than 16 values');selectors=[d['components'],*(x['components'] for x in d.get('permutations',[]))]
 for c in selectors:
  g=c.get('minecraft:geometry',{}).get('identifier')
  if g:check(g in geometry,f'{p.name}: missing geometry {g}')
  for mat in c.get('minecraft:material_instances',{}).values():
   k=mat.get('texture');check(k in read(rp/'textures/terrain_texture.json')['texture_data'],f'{p.name}: missing terrain key {k}')
for p in (rp/'entity').glob('*.json'):
 d=read(p)['minecraft:client_entity']['description'];check(all(g in geometry for g in d.get('geometry',{}).values()),p.name+': missing geometry')
 for path in d.get('textures',{}).values():check((rp/(path+'.png')).exists() or (tav/'runtime/RP'/(path+'.png')).exists(),p.name+': missing texture '+path)
for key,obj in read(rp/'textures/item_texture.json')['texture_data'].items():
 path=obj['textures'];check((rp/(path+'.png')).exists(),key+': missing item texture '+path)
for key,obj in read(rp/'textures/terrain_texture.json')['texture_data'].items():
 path=obj['textures'];check((rp/(path+'.png')).exists(),key+': missing block texture '+path)
for pack in [bp,rp]:
 m=read(pack/'manifest.json');check(m['header']['name']=='pack.name' and m['header']['description']=='pack.description',pack.name+': manifest strings')
 check(m['header']['version']==[0,1,2],pack.name+': stale package version')
 tavern_id=read(tav/'runtime'/pack.name/'manifest.json')['header']['uuid']
 check(any(d.get('uuid')==tavern_id and d.get('version')==[0,6,36] for d in m.get('dependencies',[])),pack.name+': stale Tavern dependency')
 icon=pack/'pack_icon.png';check(icon.exists(),pack.name+': missing icon')
 if icon.exists():
  with Image.open(icon) as image:check(image.width==image.height and image.width>=16,pack.name+': invalid icon')
 for lc in ['en_US','zh_CN','zh_TW']:
  rows=(pack/f'texts/{lc}.lang').read_text();check('pack.name=' in rows and 'pack.description=' in rows,pack.name+': '+lc+' package labels')
  for line in rows.splitlines():check(not line.startswith('# ') and (line.startswith('##') or '=' in line),pack.name+': malformed '+lc+' line '+line[:60])
recipes=[]
for p in (bp/'recipes').rglob('*.json'):
 data=read(p);recipe=next(v for k,v in data.items() if k.startswith('minecraft:recipe_'));recipes.append(recipe)
 check((bp/'items'/((recipe['result']['item']).split(':')[1]+'.json')).exists(),p.name+': unknown output item')
content=read(root/'docs/item-inventory.json');check(len(content['bottles'])==18 and len(content['furniture'])==27, 'source content inventory mismatch')
print('Compiled BP blocks',len(list((bp/'blocks').glob('*.json'))),'items',len(list((bp/'items').glob('*.json'))),'recipes',len(recipes),'models',len(geometry),'errors',len(errors))
for error in errors[:80]:print('ERROR',error)
if errors:raise SystemExit(1)
