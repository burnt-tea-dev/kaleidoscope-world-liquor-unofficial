#!/usr/bin/env python3
"""Reproducible Bedrock package from checked runtime assets."""
import hashlib,json,shutil,zipfile
from pathlib import Path
root=Path(__file__).resolve().parents[1];out=root/'dist';out.mkdir(exist_ok=True)
version='.'.join(map(str,json.loads((root/'runtime/BP/manifest.json').read_text())['header']['version']))
name=f'Kaleidoscope_World_Liquor_Unofficial_{version}_preview1.mcaddon';target=out/name
with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as archive:
 for path in sorted((root/'runtime').rglob('*')):
  if not path.is_file():continue
  info=zipfile.ZipInfo(path.relative_to(root/'runtime').as_posix(),(2026,9,24,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o100644<<16
  archive.writestr(info,path.read_bytes())
sha=hashlib.sha256(target.read_bytes()).hexdigest();(out/'SHA256SUMS').write_text(f'{sha}  {name}\n')
shutil.copy2(root/f'docs/RELEASE-NOTES-{version}.md',out/'RELEASE-NOTES.md')
print(json.dumps({'archive':str(target),'sha256':sha,'bytes':target.stat().st_size}))
