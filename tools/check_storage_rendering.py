#!/usr/bin/env python3
"""Static cross-pack cabinet projection; no world, entities or player mocks."""
import hashlib
import importlib.util
import itertools
import json
import subprocess
import sys
import os
import base64
import gzip
from functools import lru_cache
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
TAV=Path(os.environ.get('TAVERN_ROOT',str(ROOT.parent/'tavern-src')))
sys.path.insert(0,str(TAV/'tools'))
from baseline_reference import previous_bytes,reverse_functional_delta,additions as baseline_additions
from texture_paths import PATHS,check as check_texture_paths,rewrite_values
NS='kaleidoscope_world_liquor'
KT='kaleidoscope_tavern'
COMPACT_REVIEW=json.loads((ROOT/'data/compact-texture-review.json').read_text())
AUTHOR_ART_REVIEW=json.loads((ROOT/'data/current-author-art-preservation.json').read_text())
PERFORMANCE_PREVIOUS='cc8ec7b202230185a62c2786affcf7acb85a5ebe'
PERFORMANCE_REVIEWED='6bc779243fa7c46f2b33561a52387231ad21dbce'
# Public-history replacements retain the exact complete runtime trees.
PERFORMANCE_HISTORY_ALIASES={
 PERFORMANCE_PREVIOUS:('9fe8371e27d1537219bcc248c73520325740aae7','a553a3d15bdd877e0ef9117b1e7903a54da195bb'),
 PERFORMANCE_REVIEWED:('8972d98dd488ef9e2a33eb6d7b3779dbd9b475d4','357ec2ff57eec6b6b0630a2cab7fc849b31c222b'),
}
PERFORMANCE_PATHS=frozenset({'runtime/BP/scripts/effects.js'})
def read(p):return json.loads(p.read_text())
@lru_cache(maxsize=2)
def performance_sources(name):
 assert name in PERFORMANCE_PATHS
 sources=[]
 for original in (PERFORMANCE_PREVIOUS,PERFORMANCE_REVIEWED):
  replacement,expected_tree=PERFORMANCE_HISTORY_ALIASES[original]
  actual=subprocess.check_output(['git','rev-parse',replacement+':runtime'],cwd=ROOT,text=True).strip()
  assert actual==expected_tree,'Historical performance runtime tree differs'
  sources.append(subprocess.check_output(['git','show',replacement+':'+name],cwd=ROOT))
 return tuple(sources)
def performance_preimage(name,data,row):
 # Pin complete immutable source, not just a mutable review fixture's hash.
 before,after=performance_sources(name)
 assert data==after,('Unreviewed performance source',name)
 restored=reverse_functional_delta(name,data,row)
 assert restored==before,('Performance reverse delta has another preimage',name)
 return restored
def storage_reference_bytes(p):
 name=p.relative_to(ROOT).as_posix()
 if name in PERFORMANCE_PATHS:
  layers=[x for x in read(ROOT/'data/baseline-reconciliation.json')['reviewedFunctionalDeltaLayers'] if x['release']=='0.1.146']
  assert len(layers)==1 and set(layers[0]['files'])==PERFORMANCE_PATHS
  layer=layers[0]
  assert layer['previousCommit']==PERFORMANCE_PREVIOUS and layer['reviewedCommit']==PERFORMANCE_REVIEWED
  performance_preimage(name,p.read_bytes(),layer['files'][name])
 return previous_bytes(ROOT,p)
def readjs(p):
 return json.loads(storage_reference_bytes(p).decode().split('=',1)[1].strip().rstrip(';'))
def compact_preimage(p):
 row=COMPACT_REVIEW['changes'][p.relative_to(ROOT).as_posix()]
 data=p.read_bytes();assert hashlib.sha256(data).hexdigest()==row['after'],('Unreviewed compact texture reference',p)
 original=rewrite_values(json.loads(data),{new:old for old,new in PATHS.items()})
 restored=(json.dumps(original,ensure_ascii=False,indent=2)+'\n').encode()
 assert hashlib.sha256(restored).hexdigest()==row['before'],('Compact change exceeds texture paths',p)
 return restored
def digest(p):
 author=AUTHOR_ART_REVIEW['changes'].get(p.relative_to(ROOT).as_posix())
 if author:
  assert hashlib.sha256(p.read_bytes()).hexdigest()==author['after'],('Unreviewed current author art',p)
  original=gzip.decompress(base64.b64decode(author['beforeGzipBase64'],validate=True))
  assert hashlib.sha256(original).hexdigest()==author['before'],('Author art predecessor corrupt',p)
  return author['before']
 row=COMPACT_REVIEW['changes'].get(p.relative_to(ROOT).as_posix())
 data=compact_preimage(p) if row and not row['handled_by_baseline_reference'] else storage_reference_bytes(p)
 return hashlib.sha256(data).hexdigest()
def object_digest(o):return hashlib.sha256(json.dumps(o,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def main():
 from foundation.source_contract import check as check_foundation_sources
 foundation_contract=check_foundation_sources(TAV,ROOT)
 from drink_content_contract import check as check_drink_content, CURRENT_SOURCES
 drink_contract=check_drink_content(ROOT)
 # The display owner is checked through current behavior and the original
 # Java method's numerical output, rather than reconstructing older code.
 visual_source='runtime/BP/scripts/freezer-visuals.js'
 ledger=read(ROOT/'data/baseline-reconciliation.json')
 assert visual_source not in ledger['files']
 assert all(visual_source not in layer['files'] for layer in ledger['reviewedFunctionalDeltaLayers'])
 assert visual_source not in read(ROOT/'data/freezer-visual-additions.json')['files']
 subprocess.run(['node',str(ROOT/'tests/freezer-result-height.test.mjs')],check=True)
 # Both reviewed JS bodies are bound even where an older storage guard only
 # checks selected semantics rather than a complete historical file digest.
 for name in PERFORMANCE_PATHS:
  layer=next(x for x in read(ROOT/'data/baseline-reconciliation.json')['reviewedFunctionalDeltaLayers'] if x['release']=='0.1.146')
  performance_preimage(name,(ROOT/name).read_bytes(),layer['files'][name])
 spec=importlib.util.spec_from_file_location('creative_history',TAV/'tools/creative/historical.py')
 history=importlib.util.module_from_spec(spec);spec.loader.exec_module(history)
 projection=history.LegacyMenuProjection(ROOT)
 baseline=read(ROOT/'data/storage-preserved-0.1.4.json')
 assert COMPACT_REVIEW['test_only'] is True
 assert COMPACT_REVIEW['renames']=={'runtime/RP/'+new+'.png':'runtime/RP/'+old+'.png' for old,new in PATHS.items()}
 check_texture_paths(ROOT/'runtime/RP')
 for name in COMPACT_REVIEW['changes']:compact_preimage(ROOT/name)
 reviewed=read(ROOT/'data/guide-destruction-review.json')
 plane_review=read(ROOT/'data/drink-plane-review.json')['files']
 additions=dict(read(ROOT/'data/freezer-visual-additions.json')['files'])
 # The current Java asset contract owns blue dye. Its old wrong-image witness
 # is retired; hashes below inspect current bytes and never fabricate a past PNG.
 from freezer_ingredient_art import check as check_ingredient_art
 current_ingredient_assets=check_ingredient_art()
 assert not (set(additions)&set(current_ingredient_assets))
 additions.update(current_ingredient_assets)
 # Current-source result is additive; keep all older art/tree assertions.
 for name in read(ROOT/'data/current-freezer-review.json')['additions']:
  assert name in baseline_additions(ROOT),('Unregistered current freezer addition',name)
  if name.startswith('runtime/RP/') or '/entities/' in name:
   assert name not in additions;additions[name]=digest(ROOT/name)
 for name in read(ROOT/'data/freezer-native-input-review.json')['additions']:
  assert name in baseline_additions(ROOT),('Unregistered native input addition',name)
  if name.startswith('runtime/RP/') or '/entities/' in name:
   assert name not in additions;additions[name]=digest(ROOT/name)
 # The original magma strip remains unchanged for historical/source review.
 # Its new opaque interpolation atlas is derived only from those source texels;
 # the authoring checker verifies the whole active route before excluding these
 # exact additions from the unchanged historical texture-tree witness.
 from freezer_surface_animation import planned as freezer_animation_outputs
 current_freezer_animation=freezer_animation_outputs()
 from entity_material_registry import check as check_entity_material_registry
 check_entity_material_registry(ROOT/'runtime/RP',[TAV/'runtime/RP'])
 assert not (ROOT/'runtime/RP/materials/freezer_surface.material').exists(), 'Unloaded legacy material entry remains'
 for name in ('runtime/RP/materials/entity.material',
              'runtime/RP/textures/repair/freezer_magma_interpolated.png',
              'runtime/RP/textures/repair/freezer_magma_interpolated.texture_set.json'):
  path=ROOT/name
  assert name in baseline_additions(ROOT) and name not in additions
  assert path.read_bytes()==current_freezer_animation[path],('Unreviewed freezer animation addition',name)
  additions[name]=digest(path)
 highball=['runtime/RP/models/entity/kwl_highball_111.geo.json','runtime/RP/textures/kwl/generated/kaleidoscope_world_liquor__block__mixology__highball.png','runtime/RP/textures/kwl/items/highball.png','runtime/BP/items/highball.json','runtime/BP/blocks/cup_highball.json']
 for name in highball:
  assert name in baseline_additions(ROOT);additions[name]=digest(ROOT/name)
 # Source-backed critical sprite is additive; never rewrite the old texture tree.
 critical=read(ROOT/'data/java-critical-source.json')['texture'];name=critical['output']
 assert name in baseline_additions(ROOT) and name not in additions
 assert digest(ROOT/name)==critical['source_sha256'];additions[name]=critical['source_sha256']
 # Reviewed original effect sprites are additive. Preserve the historical texture
 # tree assertion and separately verify exact source PNG hashes before exclusion.
 for row in read(ROOT/'data/effect-icon-source.json')['unchanged_pngs']:
  name='runtime/RP/'+row['runtime'];assert name not in additions;additions[name]=row['sha256']
 break_review=read(ROOT/'data/break-feedback-review.json')
 for path,h in break_review['additions'].items():
  assert path not in additions,('Duplicate reviewed addition',path);additions[path]=h
 for path,h in additions.items():assert digest(ROOT/path)==h,('Unreviewed runtime addition',path)
 def historical_digest(p,raw=None):
  name=p.relative_to(ROOT).as_posix()
  change=plane_review.get(name)
  if change:
   assert digest(p)==change['after'],('Unreviewed drink plane mutation',p)
   return change['before']
  change=break_review['changes'].get(name)
  if change:
   assert digest(p) in (change['before'],change['after']),('Unreviewed break-feedback mutation',p)
   return change['before']
  if name in COMPACT_REVIEW['changes']:return digest(p)
  if name in AUTHOR_ART_REVIEW['changes']:return digest(p)
  return hashlib.sha256(raw).hexdigest() if raw is not None else digest(p)

 def historical_block_bytes(p):
  raw=projection.read_bytes(p);change=reviewed['blocks'].get(p.relative_to(ROOT).as_posix())
  actual=digest(p)
  if not change:return raw
  assert actual==change['afterSha256'],('Unreviewed block mutation',p)
  block=json.loads(raw);c=block['minecraft:block']['components'];c['minecraft:destructible_by_explosion']=change['beforeExplosion'];c.pop('kaleidoscope_tavern:natural_break',None)
  if 'placementReview' in change:
   assert block['minecraft:block']['description'].get('traits')==change['placementReview']['addedTraits']
   block['minecraft:block']['description'].pop('traits')
  return (json.dumps(block,ensure_ascii=False,indent=2)+'\n').encode()
 items=readjs(ROOT/'runtime/BP/scripts/visual-items.js')
 compact=readjs(ROOT/'runtime/BP/scripts/compact-items.js')
 assert items[KT+':watermelon_juice']==44
 assert object_digest({k:v for k,v in items.items() if k!=KT+':watermelon_juice'})==baseline['visualItemsSha256']
 assert compact[-1]==KT+':watermelon_juice' and object_digest(compact[:-1])==baseline['compactItemsSha256']
 assert items[KT+':molotov']==25 and KT+':molotov' in compact
 assert not any(i.startswith(KT+':watermelon_juice_q') for i in items)
 # Only effect ownership intentionally changes in this foundation refactor.
 # Keep the historical baseline unchanged and explicitly test its replacement.
 changed={'runtime/BP/scripts/effects.js'} | CURRENT_SOURCES
 for path,h in baseline['files'].items():
  if path not in changed:assert historical_digest(ROOT/path)==h,path
 effects=(ROOT/'runtime/BP/scripts/effects.js').read_text()
 assert 'readTavernEffects' in effects and 'setDynamicProperty' not in effects and 'world.getAbsoluteTime' not in effects
 preserved=len(baseline['files'])-len(changed)
 for prefix,expected in baseline['trees'].items():
  entries={COMPACT_REVIEW['renames'].get(p.relative_to(ROOT).as_posix(),p.relative_to(ROOT).as_posix()):historical_digest(p,historical_block_bytes(p)) for p in (ROOT/prefix).rglob('*') if p.is_file() and p.relative_to(ROOT).as_posix() not in additions}
  actual=hashlib.sha256(''.join(k+'\0'+v+'\n' for k,v in sorted(entries.items())).encode()).hexdigest()
  assert len(entries)==expected['files'] and actual==expected['sha256'],prefix
  preserved+=len(entries)
 subprocess.run([sys.executable,str(ROOT/'tools/build_drink_colors.py'),'--check'],check=True)
 # Pure exported slot math, not the module which subscribes to engine events.
 node="""
 import {barCabinetVisualPose} from '../tavern-src/runtime/BP/scripts/core/bar-cabinet.js';
 import {cellarCabinetVisualPose} from '../tavern-src/runtime/BP/scripts/core/cellar-cabinet.js';
 const cabinetVisualPose=(f,s,c,single=false)=>{const pose=c?cellarCabinetVisualPose(s,f):barCabinetVisualPose(s?'right':'left',single,f);return {...pose,rotation:{...pose.rotation,x:0}};};
 const cases=[];
 for(let f=0;f<4;f++){
  for(let slot=0;slot<9;slot++)cases.push({family:'cellar_cabinet',slot,facing:f,pose:cabinetVisualPose(f,slot,true)});
  for(const [slot,single] of [[0,false],[1,false],[0,true]])cases.push({family:'bar_cabinet',slot,single,side:slot?'right':'left',facing:f,pose:cabinetVisualPose(f,slot,false,single)});
 }
 console.log(JSON.stringify(cases));
 """
 node=node.replace('../tavern-src/',TAV.as_uri()+'/')
 cases=json.loads(subprocess.check_output(['node','--input-type=module','-e',node],cwd=ROOT,text=True))
 spec=importlib.util.spec_from_file_location('tavern_reference',TAV/'tools/check_storage_rendering.py')
 reference=importlib.util.module_from_spec(spec);spec.loader.exec_module(reference)
 contract=read(TAV/'data/storage-render-source.json')
 geometry={g['description']['identifier']:g for root in (TAV,ROOT) for p in (root/'runtime/RP/models').rglob('*.json') for g in read(p).get('minecraft:geometry',[])}
 animations={name:a for root in (TAV,ROOT) for p in (root/'runtime/RP/animations').glob('*.json') for name,a in read(p).get('animations',{}).items()}
 clients={mode:read(ROOT/f'runtime/RP/entity/cabinet_{mode}.json')['minecraft:client_entity']['description'] for mode in ('bar','cellar')}
 arrays=read(ROOT/'runtime/RP/render_controllers/cabinet.json')['render_controllers']['controller.render.kwl.cabinet']['arrays']
 assert arrays['geometries']['Array.models']==[f'Geometry.kind_{i}' for i in range(45)]
 assert arrays['textures']['Array.textures']==[f'Texture.kind_{i}' for i in range(45)]
 bindings=0
 for mode,client in clients.items():
  assert client['geometry']['kind_25']=='geometry.kt_runtime.storage_molotov'
  assert len(client['geometry'])==len(client['textures'])==45
  for key,gid in client['geometry'].items():
   assert geometry[gid]['bones'][0]['pivot']==[0,0,0],(mode,key)
   bindings+=1
  bp=read(ROOT/f'runtime/BP/entities/cabinet_{mode}.json')['minecraft:entity']['description']
  assert bp['properties'][NS+':kind']['range']==[0,44]
  assert client['scripts']['scale']==('1.0' if mode=='cellar' else '0.9')
 # Assert every shipped wood cabinet routes to these common helpers.
 blocks=list((ROOT/'runtime/BP/blocks').glob('*_cabinet.json'))
 assert len(blocks)==10
 for p in blocks:
  d=read(p)['minecraft:block'];assert NS+':furniture' in d['components']
 furniture=(ROOT/'runtime/BP/scripts/furniture.js').read_text()
 assert 'forwardFurnitureTick' in furniture and 'VISUAL_ITEMS' not in furniture and 'function cabinet(' not in furniture
 assert 'createExtensionFurniture' in (TAV/'runtime/BP/scripts/bedrock/extension-furniture.js').read_text()
 adapter=(TAV/'runtime/BP/scripts/bedrock/extension-furniture.js').read_text()
 maintenance=(TAV/'runtime/BP/scripts/bedrock/storage-visual-maintenance.js').read_text()
 assert "syncStorageVisualPose(entity,NS+':storage_kind',bottle.kind,at,pose.rotation.y)" in adapter
 assert 'entity.setRotation({x:0,y:yaw})' in maintenance,'RP must exclusively own model pitch'
 checks=0;maximum=0
 for case in cases:
  client=clients['cellar' if case['family']=='cellar_cabinet' else 'bar']
  assert case['pose']['rotation']['x']==0,'RP must exclusively own model pitch'
  for model in ('molotov','watermelon_juice'):
   g=geometry[client['geometry']['kind_'+str(items[KT+':'+model])]]
   for lo,hi in contract['models'][model]['boxes']:
    for jv in itertools.product(*zip(lo,hi)):
     bv=[8-jv[0],jv[1],jv[2]-8]
     expected=reference.java_point(list(jv),case,contract)
     actual=reference.bedrock_point(bv,case,client,g,animations)
     delta=max(abs(a-b) for a,b in zip(expected,actual));maximum=max(maximum,delta)
     assert delta<1e-12,(case,model,expected,actual)
     checks+=1
 report={'baselineCommit':baseline['baselineCommit'],'javaReferenceCommit':contract['upstreamCommit'],'cabinetBlockVariants':len(blocks),'helperFamilies':2,'facings':4,'poseCases':len(cases),'vertexComparisons':checks,'maxCoordinateErrorBlocks':maximum,'modelBindings':bindings,'preservedFiles':preserved,'creativeMenuProjectionFiles':len(projection.menus),'currentSourceAssets':current_ingredient_assets,'foundation':foundation_contract,'molotovKind':25,'watermelonKind':44,'playerSimulation':False,'bdsTest':'NOT_RUN','clientVisualTest':'NOT_RUN'}
 version='.'.join(map(str,read(ROOT/'runtime/BP/manifest.json')['header']['version']))
 (ROOT/f'docs/STORAGE-VALIDATION-{version}.json').write_text(json.dumps(report,indent=2)+'\n')
 print(json.dumps(report))
if __name__=='__main__':main()
