"""Only the reviewed version identity may change in the historical storage view."""
import copy,hashlib,importlib.util,unittest
from pathlib import Path
from unittest.mock import patch
spec=importlib.util.spec_from_file_location('storage_check',Path(__file__).with_name('check_storage_rendering.py'));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class CurrentDrinkContracts(unittest.TestCase):
 def test_actual_current_source_and_registration(self):
  from drink_content_contract import check
  self.assertEqual(check()['source_effect_tables'],'passed')
 def test_changed_effect_storage_or_signature_is_rejected(self):
  from drink_content_contract import check_documents,readjs,ROOT
  content=readjs(ROOT/'runtime/BP/scripts/content.js');payload=readjs(ROOT/'runtime/BP/scripts/payload.js')
  for domain in ['effect','storage','signature']:
   with self.subTest(domain=domain):
    drinks=copy.deepcopy(content);wire=copy.deepcopy(payload)
    if domain=='effect':next(row for row in drinks if row.get('base','').endswith(':maotai'))['effects'][2][1]['duration']+=1
    elif domain=='storage':drinks[0]['maxCount']+=1
    else:next(row for row in wire['shakerInputs'] if row['item'].endswith(':maotai_q4'))['effects'][1]['amplifier']+=1
    with self.assertRaises(AssertionError):check_documents(drinks,wire)
class PerformanceProjectionTests(unittest.TestCase):
 def setUp(self):
  self.layer=next(row for row in m.read(m.ROOT/'data/baseline-reconciliation.json')['reviewedFunctionalDeltaLayers'] if row['release']=='0.1.146')
 def test_public_history_alias_rejects_a_different_runtime(self):
  old=m.PERFORMANCE_HISTORY_ALIASES[m.PERFORMANCE_PREVIOUS]
  different=m.PERFORMANCE_HISTORY_ALIASES[m.PERFORMANCE_REVIEWED][0]
  m.performance_sources.cache_clear();self.addCleanup(m.performance_sources.cache_clear)
  with patch.dict(m.PERFORMANCE_HISTORY_ALIASES,{m.PERFORMANCE_PREVIOUS:(different,old[1])}):
   with self.assertRaisesRegex(AssertionError,'Historical performance runtime tree differs'):
    m.performance_sources('runtime/BP/scripts/effects.js')
 def test_exact_frozen_sources_reverse_to_immutable_w145_before_old_storage_guards(self):
  self.assertEqual(set(self.layer['files']),m.PERFORMANCE_PATHS)
  for name,row in self.layer['files'].items():
   with self.subTest(path=name):
    before,after=m.performance_sources(name)
    self.assertEqual((m.ROOT/name).read_bytes(),after)
    self.assertEqual(m.performance_preimage(name,after,row),before)
 def test_extra_line_is_rejected_even_with_synchronized_fixture_hash(self):
  for name,row in self.layer['files'].items():
   with self.subTest(path=name):
    _,after=m.performance_sources(name);changed=after+b'\n// unreviewed source\n'
    with self.assertRaises(AssertionError):m.performance_preimage(name,changed,row)
    updated=copy.deepcopy(row);updated['after']=hashlib.sha256(changed).hexdigest()
    with self.assertRaises(AssertionError):m.performance_preimage(name,changed,updated)
 def test_other_preimage_is_rejected_even_with_synchronized_fixture_hash(self):
  for name,row in self.layer['files'].items():
   with self.subTest(path=name):
    before,after=m.performance_sources(name);updated=copy.deepcopy(row)
    updated['reverseOps'][-1][2]+='// forged predecessor\n';updated['before']=hashlib.sha256(before+b'// forged predecessor\n').hexdigest()
    with self.assertRaises(AssertionError):m.performance_preimage(name,after,updated)
if __name__=='__main__':unittest.main()
