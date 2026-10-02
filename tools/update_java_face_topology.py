"""Remove only faces absent in pinned Java1.1.9; never rebuild world geometries."""
import argparse,copy,hashlib,json
from update_freezer_java_art import ROOT,SOURCE,verify_source

def read(p):return json.loads(p.read_text())
def non_face_digest(j):
 masked=copy.deepcopy(j)
 for g in masked['minecraft:geometry']:
  for b in g['bones']:
   for c in b.get('cubes',[]):c.pop('uv')
 return hashlib.sha256(json.dumps(masked,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def planned():
 verify_source();out={}
 for row in read(SOURCE/'face-pruning.json')['entries']:
  path=ROOT/row['runtime'];doc=read(path);assert non_face_digest(doc)==row['non_face_sha256'],('Unrelated geometry mutation',row['runtime'])
  model=read(SOURCE/row['source']);g=doc['minecraft:geometry'][0];cubes=[c for b in g['bones'] for c in b.get('cubes',[])]
  assert len(cubes)==len(model['elements'])
  sx=g['description']['texture_width']/16;sy=g['description']['texture_height']/16
  for e,c in zip(model['elements'],cubes):
   assert e.get('rotation',{}).get('angle',0)==0
   assert c['origin']==[8-e['to'][0],e['from'][1],e['from'][2]-8]
   assert c['size']==[e['to'][i]-e['from'][i] for i in range(3)]
   assert set(e['faces'])<=set(c['uv']),('Missing retained face',row['runtime'])
   for side,f in e['faces'].items():
    u0,v0,u1,v1=f['uv'];u0*=sx;u1*=sx;v0*=sy;v1*=sy;rotation=f.get('rotation',0)
    if rotation==180:u0,v0,u1,v1=u1,v1,u0,v0;rotation=0
    assert rotation==0,('Unreviewed UV rotation',row['runtime'])
    if side in ('up','down'):u0,v0,u1,v1=u1,v1,u0,v0
    assert c['uv'][side]=={'uv':[u0,v0],'uv_size':[u1-u0,v1-v0],'material_instance':'default'},('Retained UV/material changed',row['runtime'],side)
   c['uv']={face:data for face,data in c['uv'].items() if face in e['faces']}
  assert sum(len(c['uv']) for c in cubes)==row['after_faces']
  out[path]=doc
 return out

def check(write=False):
 files=planned()
 for p,j in files.items():
  if write:p.write_text(json.dumps(j,ensure_ascii=False,indent=2)+'\n')
  else:assert read(p)==j,('Outdated Java face inventory',p)
 print('11 latest-Java geometry masks verified;150 obsolete faces removed; other fields preserved')
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--write',action='store_true');a=p.parse_args();check(a.write)
