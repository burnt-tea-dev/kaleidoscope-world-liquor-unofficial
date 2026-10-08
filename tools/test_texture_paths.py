import json,tempfile,unittest
from pathlib import Path
from texture_paths import PATHS,normalize,check
class TexturePaths(unittest.TestCase):
 def setUp(self):
  self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup);self.rp=Path(self.temp.name)
  self.original_textures={}
  for i,(old,new) in enumerate(PATHS.items()):
   p=self.rp/(old+'.png');p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(bytes([i,42,128]));self.original_textures[old]=p.read_bytes()
  self.original={'texture_data':{old:{'textures':old} for old in PATHS},'model':'geometry.unchanged','other':['unrelated',{'k':next(iter(PATHS))}]}
  (self.rp/'refs.json').write_text(json.dumps(self.original))
 def test_references_aliases_and_bytes(self):
  normalize(self.rp);check(self.rp)
  for old,new in PATHS.items():self.assertEqual((self.rp/(new+'.png')).read_bytes(),self.original_textures[old])
  data=json.loads((self.rp/'refs.json').read_text())
  self.assertEqual(set(data['texture_data']),set(self.original['texture_data']))
  self.assertEqual(data['model'],'geometry.unchanged')
  self.assertEqual(data['other'][0],'unrelated')
  self.assertEqual(data['other'][1]['k'],next(iter(PATHS.values())))
 def test_idempotent(self):
  normalize(self.rp);before={str(p):p.read_bytes() for p in self.rp.rglob('*') if p.is_file()}
  self.assertEqual(normalize(self.rp),[])
  self.assertEqual(before,{str(p):p.read_bytes() for p in self.rp.rglob('*') if p.is_file()})
 def test_converter_regeneration_same_bytes(self):
  normalize(self.rp)
  for old,new in PATHS.items():(self.rp/(old+'.png')).write_bytes((self.rp/(new+'.png')).read_bytes())
  normalize(self.rp);check(self.rp)
 def test_new_overlong_path_rejected(self):
  normalize(self.rp);(self.rp/('x'*101)).write_bytes(b'x')
  with self.assertRaises(AssertionError):check(self.rp)
 def test_conflict_fails_before_writes(self):
  old,new=list(PATHS.items())[-1];(self.rp/(new+'.png')).write_bytes(b'conflict')
  with self.assertRaises(ValueError):normalize(self.rp)
  self.assertTrue(all((self.rp/(old+'.png')).exists() for old in PATHS))
if __name__=='__main__':unittest.main()
