#!/usr/bin/env python3
"""Check current source cups and retain every unrelated historical surface guard.

The four reviewed source updates supersede their old UV/geometry witnesses.
Those immutable witnesses remain intact. All cups still use the host's actual
conflict, repair-idempotence and UV inventory checks; packaging uses no preimage.
"""
import base64, copy, gzip, hashlib, io, json, sys, tempfile
from pathlib import Path
from PIL import Image
import update_current_cocktail_art as author

sys.path.insert(0,str(author.TAV/'tools'))
import check_drink_surfaces as host

def check():
 root=author.ROOT
 history=json.loads((root/'data/drink-surface-review.json').read_text())
 review=json.loads((root/'data/current-author-art-preservation.json').read_text())
 with tempfile.TemporaryDirectory(prefix='world-liquor-source-surface-') as directory:
  files,rows=author.planned(Path(directory))
  source_meshes={root/f'runtime/RP/models/entity/kwl_g_{identity}.geo.json' for identity in author.ART.values()}
  assert len(source_meshes)==4 and {path for path in files if path.suffix=='.json'}==source_meshes
  for path,data in files.items():
   if path.suffix=='.png':
    expected=Image.open(io.BytesIO(data)).convert('RGBA');actual=Image.open(path).convert('RGBA')
    assert expected.size==actual.size and expected.tobytes()==actual.tobytes(),('Current source pixels changed',path)
   else:assert json.loads(path.read_bytes())==json.loads(data),('Current source geometry/UV changed',path)
  host.fixture_checks();ids=host.geometry_ids(root);count=0;face_count=0
  for path in (root/'runtime/RP/models').rglob('*.json'):
   doc=json.loads(path.read_text());selected=[g for g in doc.get('minecraft:geometry',[]) if g['description']['identifier'] in ids]
   if not selected:continue
   count+=len(selected);face_count+=sum(len(host.faces(g)) for g in selected)
   assert not any(host.conflicts(g) for g in selected),path
   assert host.repair_geometry(copy.deepcopy(doc))==0,('Unstable drink sheet repair',path)
   name=path.relative_to(root).as_posix();old=history['files'].get(name)
   if path in files:
    # Only the four converter-owned meshes can replace a historical witness.
    assert name in review['changes'] and path.suffix=='.json'
    row=review['changes'][name]
    assert old and old['after']==row['before'],('Source overlay predecessor differs',name)
    predecessor=gzip.decompress(base64.b64decode(row['beforeGzipBase64'],validate=True))
    assert hashlib.sha256(predecessor).hexdigest()==old['after'],('Source predecessor bytes changed',name)
    assert host.uv_digest(json.loads(predecessor))==old['uvInventory'],('Historical predecessor UV changed',name)
    assert hashlib.sha256(path.read_bytes()).hexdigest()==row['after'],('Source overlay differs',name)
    assert host.uv_inventory(doc)==host.uv_inventory(json.loads(files[path]))
   elif old:
    assert hashlib.sha256(path.read_bytes()).hexdigest()==old['after'],('Unreviewed surface mutation',path)
    assert host.uv_digest(doc)==old['uvInventory'],('Unreviewed face artwork',path)
  pair=[root/'runtime/RP/models/entity'/name for name in ['rig_signature_glass.geo.json','rig_signature_liquid.geo.json']]
  if all(path.exists() for path in pair):
   combined={'bones':[bone for path in pair for bone in json.loads(path.read_text())['minecraft:geometry'][0]['bones']]}
   assert not host.conflicts(combined),'Signature glass/liquid render passes overlap'
 print(json.dumps({'current_source_cups':len(rows),'authored_inventory_icons':2,'geometriesChecked':count,'renderedFacesChecked':face_count,'remainingSameFacingDepthConflicts':0,'idempotent':True,'historical_witnesses_preserved':True,'clientTest':False}))

if __name__=='__main__':check()
