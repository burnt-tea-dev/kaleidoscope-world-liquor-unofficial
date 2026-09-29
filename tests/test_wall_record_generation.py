import ast
import copy
import hashlib
import json
from pathlib import Path
import sys
import tempfile
import unittest
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tools'))
from wall_record_definition import normalize

class WallRecordGeneration(unittest.TestCase):
    def test_old_converter_output_normalizes_to_committed_bytes(self):
        path=ROOT/'runtime/BP/blocks/wall_record.json';expected=path.read_bytes()
        old=json.loads(expected);b=old['minecraft:block'];b['components']['minecraft:transformation']['rotation'][1]=180
        for perm in b['permutations']:
            rot=perm['components'].get('minecraft:transformation')
            if rot:rot['rotation'][1]=(rot['rotation'][1]+180)%360
        with tempfile.TemporaryDirectory() as td:
            p=Path(td)/'wall_record.json';p.write_text(json.dumps(old));normalize(p)
            self.assertEqual(p.read_bytes(),expected)
            normalize(p);self.assertEqual(p.read_bytes(),expected)
    def test_normalization_preserves_non_orientation_fields(self):
        before=json.loads((ROOT/'runtime/BP/blocks/wall_record.json').read_text())
        with tempfile.TemporaryDirectory() as td:
            p=Path(td)/'wall_record.json';p.write_text(json.dumps(before));normalize(p);after=json.loads(p.read_text())
        self.assertEqual(after,before)
        self.assertEqual(len([x for x in before['minecraft:block']['permutations'] if 'model_group' in x['condition']]),25)
    def test_source_converter_moved_without_editing_and_public_entrypoint_retained(self):
        path=ROOT/'tools/_build_port_source.py'
        self.assertTrue(path.exists(), 'Pinned source converter is required in a repository checkout')
        raw=path.read_bytes()
        self.assertEqual(hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest(),'96829949091277a909a5b7c071358bdf94aa6387')
        source=(ROOT/'tools/build_port.py').read_text();ast.parse(source)
        self.assertLess(source.index('runpy.run_path('),source.index('normalize(tools.parent'))

if __name__=='__main__':unittest.main()
