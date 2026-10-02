"""Unchanged original sprite audit; no client rendering claim."""
from pathlib import Path
import hashlib,json
from PIL import Image
root=Path(__file__).resolve().parents[1]
source=json.loads((root/'data/effect-icon-source.json').read_text())
assert source['jar_sha256']=='d29a7507b3cfc90f9ff620d75e69102c0d25b3de8dbd0d89c73331e4c9e12205'
assert len(source['unchanged_pngs'])==15
for row in source['unchanged_pngs']:
 path=root/'runtime/RP'/row['runtime']
 assert hashlib.sha256(path.read_bytes()).hexdigest()==row['sha256'],path
 assert Image.open(path).size==tuple(row['size'])==(18,18),path
print('15 original World Liquor effect sprites verified unchanged; client rendering not tested')
