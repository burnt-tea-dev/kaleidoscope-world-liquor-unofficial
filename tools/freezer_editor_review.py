"""Review-only Blockbench projects. No runtime files are modified or exported.
The Bedrock decode follows Blockbench 5.2.2's I6/D6 codec transforms.
"""
import argparse, base64, hashlib, json, subprocess, uuid
from itertools import count
from pathlib import Path
from PIL import Image
ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--output', type=Path, required=True)
args = parser.parse_args()
OUT = args.output.resolve()
OUT.mkdir(parents=True, exist_ok=True)
inputs = {Path(__file__).resolve()}
sequence = count()
SIDES=['north','east','south','west','up','down']
def uid():return str(uuid.uuid5(uuid.NAMESPACE_URL, 'freezer-editor-review/'+str(next(sequence))))
def read(p):
 inputs.add(p); return json.loads(p.read_text())
class Scene:
 def __init__(self,name):self.j={'meta':{'format_version':'5.0','model_format':'free','box_uv':False},'name':name,'resolution':{'width':128,'height':128},'elements':[],'groups':[],'outliner':[],'textures':[]};self.tex={}
 def texture(self,path):
  if str(path) in self.tex:return self.tex[str(path)]
  inputs.add(path); i=len(self.j['textures']);w,h=Image.open(path).size; self.tex[str(path)]=i
  self.j['textures'].append({'name':path.name,'id':str(i),'uuid':uid(),'width':w,'height':h,'uv_width':w,'uv_height':h,'render_mode':'default','render_sides':'front','internal':True,'saved':True,'source':'data:image/png;base64,'+base64.b64encode(path.read_bytes()).decode()});return i
 def group(self,name,origin=[0,0,0],rotation=[0,0,0],parent=None):
  u=uid();self.j['groups'].append({'name':name,'uuid':u,'origin':origin,'rotation':rotation,'visibility':True,'export':True,'isOpen':False});node={'uuid':u,'isOpen':False,'children':[]}; (parent['children'] if parent else self.j['outliner']).append(node);return node
 def cube(self,name,fr,to,faces,origin,rotation,parent):
  u=uid();allfaces={side:{'uv':[0,0,0,0],'texture':None} for side in SIDES};allfaces.update(faces)
  self.j['elements'].append({'name':name,'uuid':u,'type':'cube','box_uv':False,'from':fr,'to':to,'origin':origin,'rotation':rotation,'autouv':0,'faces':allfaces,'visibility':True});parent['children'].append(u)
 def bedrock(self,path,texture,offset=[0,0,0],yaw=0,parent=None,name='canonical'):
  g=read(path)['minecraft:geometry'][0];tex=self.texture(texture);group=self.group(name,offset,[0,yaw,0],parent);nodes={}
  def add(v):return [v[i]+offset[i] for i in range(3)]
  for b in g['bones']:
   p=b.get('pivot',[0,0,0]);r=b.get('rotation',[0,0,0]);node=self.group(b['name'],add([-p[0],p[1],p[2]]),[-r[0],-r[1],r[2]],nodes.get(b.get('parent'),group));nodes[b['name']]=node
   for n,c in enumerate(b.get('cubes',[])):
    o=c['origin'];z=c['size'];fr=[-o[0]-z[0],o[1],o[2]];to=[fr[i]+z[i] for i in range(3)];p=c.get('pivot',[0,0,0]);r=c.get('rotation',[0,0,0]);faces={}
    for side,f in c['uv'].items():
     a,bv=f['uv'];du,dv=f['uv_size'];uv=[a,bv,a+du,bv+dv]
     if side in ('up','down'):uv=uv[2:]+uv[:2]
     faces[side]={'uv':uv,'texture':tex,'rotation':f.get('uv_rotation',0)}
    self.cube(b['name']+'_'+str(n),add(fr),add(to),faces,add([-p[0],p[1],p[2]]),[-r[0],-r[1],r[2]],node)
 def java(self,path,texture,offset=[0,0,0]):
  j=read(path);tex=self.texture(texture);group=self.group('Java authored '+path.stem,offset)
  def add(v):return [v[i]+offset[i]+(-8 if i!=1 else 0) for i in range(3)]
  for n,e in enumerate(j['elements']):
   r=e.get('rotation',{});rot=[0,0,0];rot['xyz'.index(r.get('axis','y'))]=r.get('angle',0)
   faces={s:{'uv':[x*8 for x in f['uv']],'texture':tex,'rotation':f.get('rotation',0)} for s,f in e['faces'].items()}
   self.cube('Java element '+str(n),add(e['from']),add(e['to']),faces,add(r.get('origin',[8,0,8])),rot,group)
 def save(self,name): (OUT/name).write_text(json.dumps(self.j,indent=2)+'\n')
RP=ROOT/'runtime/RP';SRC=ROOT/'data/java-parity/neoforge-1.1.9/assets/kaleidoscope_world_liquor'
GEO={'open':'kwl_g_7c341bb644967296.geo.json','close':'kwl_g_5b611b0754ffa64d.geo.json'}
for state in ('open','close'):
 scene=Scene('Java LEFT / canonical RIGHT - '+state)
 scene.java(SRC/f'models/block/fridge_{state}.json',SRC/'textures/block/fridge.png',[-14,0,0])
 scene.bedrock(RP/'models/entity'/GEO[state],RP/f'textures/kwl/generated/kaleidoscope_world_liquor__block__fridge_{state}.png',[14,0,0],name='Canonical '+state)
 scene.save('pair-'+state+'.bbmodel')
pose_tool = ROOT/'tools/freezer_editor_poses.mjs'
inputs.add(ROOT/'runtime/BP/scripts/freezer-visuals.js')
inputs.add(pose_tool)
poses=json.loads(subprocess.run(['node', str(pose_tool)], cwd=ROOT, check=True, capture_output=True, text=True).stdout)
(OUT/'runtime-poses.json').write_text(json.dumps(poses, indent=2)+'\n')
for wet in (False,True):
 scene=Scene('Canonical four facings '+('WET' if wet else 'DRY')+' - editor composite')
 for row in [r for r in poses if r['wet']==wet]:
  f=row['facing'];offset=[(f%2)*26-13,0,(f//2)*28-14]
  scene.bedrock(RP/'models/entity'/GEO['open'],RP/'textures/kwl/generated/kaleidoscope_world_liquor__block__fridge_open.png',offset,[0,90,-180,-90][f],name='Facing '+str(f))
  for ent in row['entities']:
   kind=ent['typeId'].split(':')[1].removeprefix('freezer_').removesuffix('_visual');p=ent['location'];at=[offset[0]+(p['x']-.5)*16,(p['y']-64)*16,offset[2]+(p['z']-.5)*16]
   scene.bedrock(RP/f'models/entity/freezer_{kind}.geo.json',RP/f'textures/repair/freezer_{kind}.png',at,-ent['rotation'],name=f"Facing {f} {ent['properties']['kaleidoscope_world_liquor:visual_slot']} {kind}")
 scene.save(('wet' if wet else 'dry')+'-four-facings.bbmodel')
# Closed lid with identical source-supported planes retained for geometric occlusion only.
# Runtime actually removes helpers on close, and Java renders them without an open guard.
scene=Scene('Closed lid occlusion: retained planes - editor only')
scene.bedrock(RP/'models/entity'/GEO['close'],RP/'textures/kwl/generated/kaleidoscope_world_liquor__block__fridge_close.png')
for ent in next(r for r in poses if r['wet'] and r['facing']==0)['entities']:
 kind=ent['typeId'].split(':')[1].removeprefix('freezer_').removesuffix('_visual');p=ent['location'];at=[(p['x']-.5)*16,(p['y']-64)*16,(p['z']-.5)*16]
 scene.bedrock(RP/f'models/entity/freezer_{kind}.geo.json',RP/f'textures/repair/freezer_{kind}.png',at,-ent['rotation'],name='retained '+kind)
scene.save('closed-occlusion.bbmodel')
print('Built',len(list(OUT.glob('*.bbmodel'))),'review-only scenes')

manifest = {
 'scope': 'Editor-only source-derived composites; not Minecraft client rendering',
 'coordinate': [0, 64, 0],
 'body_source': 'Pinned NeoForge 1.1.9 fridge models and exact 128px texture',
 'placement': 'Current syncFreezerVisuals, separately tested against CF9066406 original-method oracle',
 'inputs': {str(p.relative_to(ROOT)): hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(inputs)},
 'outputs': {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(OUT.glob('*.bbmodel'))},
}
(OUT/'review-inputs.json').write_text(json.dumps(manifest, indent=2)+'\n')
