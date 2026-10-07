"""Only the reviewed version identity may change in the historical storage view."""
import hashlib,importlib.util,json,tempfile,unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('storage_check',Path(__file__).with_name('check_storage_rendering.py'));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
def data(version,recipes):return ('export const payload = '+json.dumps({'version':version,'recipes':recipes},ensure_ascii=False,indent=2)+';\n').encode()
class ProjectionTests(unittest.TestCase):
 def setUp(self):
  self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup);self.root=Path(self.temp.name)
  self.old=m.ROOT;m.ROOT=self.root;self.addCleanup(lambda:setattr(m,'ROOT',self.old));(self.root/'data').mkdir()
  self.p=self.root/'payload.js';self.p.write_bytes(data('0.1.84',['actual']))
  previous=data('0.1.67',['historical']);(self.root/'data/old.js').write_bytes(previous)
  review={'test_only':True,'before':hashlib.sha256(previous).hexdigest(),'after':hashlib.sha256(data('0.1.83',['actual'])).hexdigest(),'after_payload_version':'0.1.83','previous_payload':'data/old.js'}
  (self.root/'data/current-mixology-review.json').write_text(json.dumps(review));(self.root/'package.json').write_text(json.dumps({'version':'0.1.84'}));(self.root/'baseline.json').write_text(json.dumps({'version':[0,1,84]}))
 def test_version_only_projection_preserves_exact_reviewed_preimage(self):self.assertEqual(m.readjs(self.p),{'version':'0.1.67','recipes':['historical']})
 def test_any_recipe_change_and_unbound_identity_are_rejected(self):
  for content in [data('0.1.84',['unreviewed']),data('0.1.85',['actual'])]:
   self.p.write_bytes(content)
   with self.assertRaises(AssertionError):m.readjs(self.p)
 def test_corrupt_historical_payload_is_rejected(self):
  (self.root/'data/old.js').write_bytes(data('0.1.67',['mutated']))
  with self.assertRaises(AssertionError):m.readjs(self.p)
if __name__=='__main__':unittest.main()
