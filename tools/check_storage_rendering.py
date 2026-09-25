#!/usr/bin/env python3
"""Static cross-pack cabinet projection; no world, entities or player mocks."""
import hashlib
import importlib.util
import itertools
import json
import subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
TAV=ROOT.parent/'tavern-src'
NS='kaleidoscope_world_liquor'
KT='kaleidoscope_tavern'
def read(p):return json.loads(p.read_text())
def readjs(p):return json.loads(p.read_text().split('=',1)[1].strip().rstrip(';'))
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def object_digest(o):return hashlib.sha256(json.dumps(o,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def main():
 baseline=read(ROOT/'data/storage-preserved-0.1.4.json')
 items=readjs(ROOT/'runtime/BP/scripts/visual-items.js')
 compact=readjs(ROOT/'runtime/BP/scripts/compact-items.js')
 assert items[KT+':watermelon_juice']==44
 assert object_digest({k:v for k,v in items.items() if k!=KT+':watermelon_juice'})==baseline['visualItemsSha256']
 assert compact[-1]==KT+':watermelon_juice' and object_digest(compact[:-1])==baseline['compactItemsSha256']
 assert items[KT+':molotov']==25 and KT+':molotov' in compact
 assert not any(i.startswith(KT+':watermelon_juice_q') for i in items)
 # Only effect ownership intentionally changes in this foundation refactor.
 # Keep the historical baseline unchanged and explicitly test its replacement.
 changed={'runtime/BP/scripts/effects.js'}
 for path,h in baseline['files'].items():
  if path not in changed:assert digest(ROOT/path)==h,path
 effects=(ROOT/'runtime/BP/scripts/effects.js').read_text()
 assert 'readTavernEffects' in effects and 'setDynamicProperty' not in effects and 'world.getAbsoluteTime' not in effects
 preserved=len(baseline['files'])-len(changed)
 for prefix,expected in baseline['trees'].items():
  entries={p.relative_to(ROOT).as_posix():digest(p) for p in (ROOT/prefix).rglob('*') if p.is_file()}
  actual=hashlib.sha256(''.join(k+'\0'+v+'\n' for k,v in sorted(entries.items())).encode()).hexdigest()
  assert len(entries)==expected['files'] and actual==expected['sha256'],prefix
  preserved+=len(entries)
 payload=readjs(ROOT/'runtime/BP/scripts/payload.js');payload.pop('version')
 assert object_digest(payload)==baseline['payloadExceptVersionSha256'],'Guide and content changed beyond version'

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
 assert 'entity.setRotation({x:0,y:pose.rotation.y})' in (TAV/'runtime/BP/scripts/bedrock/extension-furniture.js').read_text()
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
 report={'baselineCommit':baseline['baselineCommit'],'javaReferenceCommit':contract['upstreamCommit'],'cabinetBlockVariants':len(blocks),'helperFamilies':2,'facings':4,'poseCases':len(cases),'vertexComparisons':checks,'maxCoordinateErrorBlocks':maximum,'modelBindings':bindings,'preservedFiles':preserved,'molotovKind':25,'watermelonKind':44,'playerSimulation':False,'bdsTest':'NOT_RUN','clientVisualTest':'NOT_RUN'}
 version='.'.join(map(str,read(ROOT/'runtime/BP/manifest.json')['header']['version']))
 (ROOT/f'docs/STORAGE-VALIDATION-{version}.json').write_text(json.dumps(report,indent=2)+'\n')
 print(json.dumps(report))
if __name__=='__main__':main()
