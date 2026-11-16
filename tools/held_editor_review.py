"""Build source/canonical editor evidence, never runtime replacements."""
import argparse,json,re,sys,copy,base64,uuid,hashlib,math,subprocess
from pathlib import Path
from PIL import Image
ROOT=R=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--output',type=Path,required=True);args=parser.parse_args()
OUT=args.output.resolve();D=OUT/'scenes';D.mkdir(parents=True,exist_ok=True)
sys.path.insert(0,str(R/'tools'));import java_geometry as java
inputs={Path(__file__).resolve(),R/'tools/java_geometry.py'};seq=0
SIDES=['north','east','south','west','up','down'];CONTEXTS=['firstperson_righthand','firstperson_lefthand','thirdperson_righthand','thirdperson_lefthand']
def read(p):inputs.add(p);return json.loads(p.read_text())
def uid():
 global seq;seq+=1;return str(uuid.uuid5(uuid.NAMESPACE_URL,'kwl-held-review/'+str(seq)))
def texture(p):
 inputs.add(p);w,h=Image.open(p).size
 return {'name':p.name,'id':'0','uuid':uid(),'width':w,'height':h,'uv_width':w,'uv_height':h,'render_mode':'default','render_sides':'front','internal':True,'saved':True,'source':'data:image/png;base64,'+base64.b64encode(p.read_bytes()).decode()}
def empty(name,fmt='java_block'):
 return {'meta':{'format_version':'5.0','model_format':fmt,'box_uv':False},'name':name,'resolution':{'width':16,'height':16},'elements':[],'groups':[],'outliner':[],'textures':[],'credit':'Source-derived review only; not native Minecraft client rendering.'}
def finalize(scene):
 for i,tex in enumerate(scene['textures']):tex['id']=str(i)
 return scene
def cube(name,fr,to,uv,origin=[8,8,8],rot=[0,0,0]):
 return {'name':name,'uuid':uid(),'type':'cube','box_uv':False,'from':fr,'to':to,'origin':origin,'rotation':rot,'autouv':0,'visibility':True,'faces':{s:uv.get(s,{'uv':[0,0,0,0],'texture':None}) for s in SIDES}}
def defaults(d):
 d=copy.deepcopy(d)
 for context in CONTEXTS:
  if context not in d and context.endswith('lefthand'):d[context]=copy.deepcopy(d.get(context.replace('lefthand','righthand'),{}))
 return d
def source(name,assets):
 identifier='kaleidoscope_world_liquor:item/'+name;m=java.resolve_model(identifier,assets)
 # Record the entire ancestor chain, not only the item wrapper.
 at=identifier
 while at:
  p=java.resource_path(at,'models',assets);v=read(p);at=v.get('parent')
 s=empty('Java '+name);s['display']=defaults(m.get('display',{}));tex={}
 for e in m['elements']:
  for f in e['faces'].values():
   tid=java.texture_id(f['texture'],m['textures'])
   if tid not in tex:
    p=java.resource_path(tid,'textures',assets);tex[tid]=len(s['textures']);s['textures'].append(texture(p))
 for i,e in enumerate(m['elements']):
  fs={}
  for side,f in e['faces'].items():
   ti=tex[java.texture_id(f['texture'],m['textures'])];t=s['textures'][ti]
   fs[side]={'uv':[v*t['uv_width' if k%2==0 else 'uv_height']/16 for k,v in enumerate(f['uv'])],'rotation':f.get('rotation',0),'texture':ti}
  rot=e.get('rotation',{});angles=[0,0,0];angles['xyz'.index(rot.get('axis','y'))]=rot.get('angle',0)
  c=cube('Java '+str(i),e['from'],e['to'],fs,rot.get('origin',[8,8,8]),angles);s['elements'].append(c);s['outliner'].append(c['uuid'])
 return s
terrain=read(R/'runtime/RP/textures/terrain_texture.json')['texture_data'];geos={g['description']['identifier']:(p,g) for p in (R/'runtime/RP/models').rglob('*.json') for g in read(p).get('minecraft:geometry',[])}
def canonical(name):
 bp=read(R/f'runtime/BP/blocks/{name}.json')['minecraft:block'];v=bp['components']['minecraft:item_visual'];gp,g=geos[v['geometry']['identifier']];s=empty('Canonical '+name);s['display']=g['item_display_transforms'];tex={}
 for key,mat in v['material_instances'].items():
  p=R/'runtime/RP'/(terrain[mat['texture']]['textures']+'.png')
  if p not in tex:tex[p]=len(s['textures']);s['textures'].append(texture(p))
 def bound(v):return [-v[0]+8,v[1],v[2]+8]
 for b in g['bones']:
  assert not any(b.get('rotation',[0,0,0])),('Unexpected rotating bone',name,b['name'])
  for c in b.get('cubes',[]):
   o=c['origin'];z=c['size'];fr=[8-o[0]-z[0],o[1],o[2]+8];to=[fr[k]+z[k] for k in range(3)];fs={}
   for side,f in c['uv'].items():
    mat=v['material_instances'].get(f.get('material_instance','default'),v['material_instances']['*']);tp=R/'runtime/RP'/(terrain[mat['texture']]['textures']+'.png');u,vv=f['uv'];du,dv=f['uv_size'];uv=[u,vv,u+du,vv+dv]
    if side in ('up','down'):uv=uv[2:]+uv[:2]
    fs[side]={'uv':uv,'texture':tex[tp],'rotation':f.get('uv_rotation',0)}
   rot=c.get('rotation',[0,0,0]);e=cube(b['name'],fr,to,fs,bound(c.get('pivot',[0,0,0])),[-rot[0],-rot[1],rot[2]]);s['elements'].append(e);s['outliner'].append(e['uuid'])
 return s
def native(name,converted):
 s=copy.deepcopy(converted);s['meta']['model_format']='bedrock_block';s['name']='Native '+name
 bp=read(R/f'runtime/BP/blocks/{name}.json')['minecraft:block'];v=bp['components']['minecraft:item_visual'];gp,g=geos[v['geometry']['identifier']];s['model_identifier']=g['description']['identifier'].removeprefix('geometry.');nodes={};s['groups']=[];s['outliner']=[];index=0
 for b in g['bones']:
  u=uid();p=b.get('pivot',[0,0,0]);r=b.get('rotation',[0,0,0]);s['groups'].append({'uuid':u,'name':b['name'],'origin':[-p[0],p[1],p[2]],'rotation':[-r[0],-r[1],r[2]],'visibility':True,'isOpen':False});node={'uuid':u,'isOpen':False,'children':[]};nodes[b['name']]=node
  for c in b.get('cubes',[]):
   e=s['elements'][index];index+=1
   for k in ['from','to','origin']:e[k]=[e[k][0]-8,e[k][1],e[k][2]-8]
   size=[e['to'][i]-e['from'][i] for i in range(3)];origin=[-e['from'][0]-size[0],e['from'][1],e['from'][2]]
   assert size==c['size'] and origin==c['origin'],('Native inverse coordinate check',name)
   node['children'].append(e['uuid'])
 for b in g['bones']:
  node=nodes[b['name']]
  if b.get('parent'):nodes[b['parent']]['children'].append(node)
  else:s['outliner'].append(node)
 return s
names=read(R/'docs/item-inventory.json')['furniture'];pairs=[]
for name in names:
 a=source(name,R/('data/java-parity/neoforge-1.1.9/assets' if name=='freezer' else 'upstream/assets'));b=canonical(name)
 for context in CONTEXTS:
  expected={k:a['display'].get(context,{}).get(k,d) for k,d in [('rotation',[0,0,0]),('translation',[0,0,0]),('scale',[1,1,1])]};assert b['display'][context]==expected,(name,context)
 for role,s in [('Java',a),('Canonical',b)]:
  s['resolution']={'width':s['textures'][0]['uv_width'],'height':s['textures'][0]['uv_height']}
  (D/f'{role}-{name}.bbmodel').write_text(json.dumps(finalize(s),indent=2)+'\n')
 n=native(name,b);(D/f'Native-{name}.bbmodel').write_text(json.dumps(finalize(n),indent=2)+'\n')
 pairs.append((name,a,b))
# Four contexts in rows, up to four item/material bindings in columns; source at left of each pair.
for batch in range(0,len(pairs),4):
 s=empty('Held contexts '+str(batch//4+1)+' source LEFT / canonical RIGHT','free')
 for col,(name,a,b) in enumerate(pairs[batch:batch+4]):
  for row,context in enumerate(CONTEXTS):
   for member,m in enumerate([a,b]):
    pose=m['display'].get(context,{});scale=pose.get('scale',[1,1,1]);assert max(scale)-min(scale)<1e-8
    offset=[col*24+member*11,row*-15,0];pivot=[offset[i]+pose.get('translation',[0,0,0])[i] for i in range(3)];rot=pose.get('rotation',[0,0,0]);gu=uid();node={'uuid':gu,'children':[]};s['outliner'].append(node);s['groups'].append({'uuid':gu,'name':name+' '+context+' '+('Java' if member==0 else 'Canonical'),'origin':pivot,'rotation':rot,'visibility':True,'isOpen':False})
    ti=len(s['textures']);s['textures']+=copy.deepcopy(m['textures'])
    for tex in s['textures'][ti:]:tex['uuid']=uid()
    for e in m['elements']:
     e=copy.deepcopy(e);e['uuid']=uid();
     for k in ['from','to','origin']:e[k]=[(e[k][i]-8)*scale[i]+pivot[i] for i in range(3)]
     for f in e['faces'].values():
      if f['texture'] is not None:f['texture']+=ti
     s['elements'].append(e);node['children'].append(e['uuid'])
 (D/f'held-sheet-{batch//4+1}.bbmodel').write_text(json.dumps(finalize(s),indent=2)+'\n')
# Inventory sprites: only exact current PNGs, no native held-size or extrusion claim.
atlas=read(R/'runtime/RP/textures/item_texture.json')['texture_data'];sprites=[]
for p in sorted((R/'runtime/BP/items').glob('*.json')):
 item=read(p)['minecraft:item'];c=item['components']
 if 'minecraft:icon' not in c:continue
 icon=c['minecraft:icon'];key=icon if isinstance(icon,str) else icon['textures']['default'];path=R/'runtime/RP'/(atlas[key]['textures']+'.png');sprites.append((item['description']['identifier'],path,c.get('minecraft:use_animation')))
sprite_sources=[]
for ident,runtime,anim in sprites:
 base=re.sub(r'_q[1-6]$','',ident.split(':')[1]);mp=R/f'upstream/assets/kaleidoscope_world_liquor/models/item/{base}.json'
 if not mp.exists():
  candidates=list((R/'upstream/assets').glob(f'*/models/item/{base}.json'));assert len(candidates)==1,(ident,candidates);mp=candidates[0]
 read(mp);ns=mp.parts[-4];model=java.resolve_model(ns+':item/'+base,R/'upstream/assets');assert not model.get('display'),('Unreviewed custom sprite pose',ident)
 source=java.resource_path(java.texture_id('#layer0',model['textures']),'textures',R/'upstream/assets');inputs.add(source)
 a=Image.open(runtime).convert('RGBA');b=Image.open(source).convert('RGBA');assert a.size==b.size and a.tobytes()==b.tobytes(),('Sprite source mismatch',ident)
 sprite_sources.append({'item':ident,'source_model':str(mp.relative_to(R)),'source_texture':str(source.relative_to(R)),'runtime':str(runtime.relative_to(R)),'pixels_equal':True})
(OUT/'sprite-source-comparison.json').write_text(json.dumps(sprite_sources,indent=2)+'\n')
for start in range(0,len(sprites),36):
 s=empty('Current sprite routes '+str(start//36+1),'free')
 for i,(name,p,anim) in enumerate(sprites[start:start+36]):
  t=texture(p);s['textures'].append(t);x=i%9*19;y=-(i//9)*19;e=cube(name,[x,y,0],[x+16,y+16,0],{'south':{'texture':i,'uv':[0,0,t['width'],t['height']]}});s['elements'].append(e);s['outliner'].append(e['uuid'])
 (D/f'sprites-{start//36+1}.bbmodel').write_text(json.dumps(finalize(s),indent=2)+'\n')
# Animation strips use Blockbench texture playback from current exported texture.
for row in read(R/'data/freezer-surface-animation.json')['sprites']:
 kind=row['kind'];meta=read(R/row['metadata']['path'])['animation'];client=read(R/f'runtime/RP/entity/freezer_{kind}.entity.json')['minecraft:client_entity']['description'];p=R/'runtime/RP'/(client['textures']['default']+'.png');t=texture(p);t['uv_height']=16;t['frame_time']=1 if kind=='magma' else meta.get('frametime',1);t['frame_order_type']='custom' if 'frames' in meta and kind!='magma' else 'loop';t['frame_order']=' '.join(str(x) for x in meta.get('frames',[]));s=empty('Animated '+kind);s['textures']=[t];e=cube(kind,[0,0,8],[16,16,8],{'south':{'texture':0,'uv':[0,0,16,16]}});s['elements']=[e];s['outliner']=[e['uuid']];(D/f'animation-{kind}.bbmodel').write_text(json.dumps(finalize(s),indent=2)+'\n')
manifest={'commit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=R,text=True).strip(),'geometric_items':len(pairs),'native_bedrock_projects':len(pairs),'held_pose_pairs':len(pairs)*4,'sprite_items':len(sprites),'native_use_animations':{kind:sum(a==kind for _,_,a in sprites) for kind in set(x[2] for x in sprites)},'source_scope':'Pinned source ancestors; historical furniture sources and current selected cabinet assets, not freshly retrieved complete current Java archive.','sheet_scope':'Inspection layout with pose transforms; native .bbmodel Display files supplied separately; no Bedrock engine/client claim.','inputs':{str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(inputs)},'outputs':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(D.glob('*.bbmodel'))}}
(OUT/'input-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');print(len(list(D.glob('*.bbmodel'))),'projects',len(pairs),'furniture',len(sprites),'sprites')
