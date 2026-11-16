"""Exercise the catalog boundary of the all-model depth guard."""
import copy
import json
from pathlib import Path
import unittest
from unittest.mock import patch

import check_current_drink_surfaces as guard


class ModelSurfaceTests(unittest.TestCase):
    def test_non_drink_stool_duplicate_is_rejected(self):
        root = guard.author.ROOT
        block = json.loads((root / 'runtime/BP/blocks/bar_stool_white.json').read_text())
        identifier = block['minecraft:block']['components']['minecraft:item_visual']['geometry']['identifier']
        self.assertNotIn(identifier, guard.host.geometry_ids(root))
        for path in (root / 'runtime/RP/models').rglob('*.json'):
            document = json.loads(path.read_text())
            geometry = next((g for g in document.get('minecraft:geometry', [])
                             if g['description']['identifier'] == identifier), None)
            if geometry is not None:
                break
        else:
            self.fail('The furniture route must resolve to a real non-drink model')
        bone = next(b for b in geometry['bones'] if b.get('cubes'))
        bone['cubes'].append(copy.deepcopy(bone['cubes'][0]))
        corrupted = json.dumps(document)
        original = Path.read_text

        def read_text(candidate, *args, **kwargs):
            return corrupted if candidate == path else original(candidate, *args, **kwargs)

        # No repository file is mutated, including on a failed assertion.
        with patch.object(Path, 'read_text', read_text):
            with self.assertRaisesRegex(AssertionError, 'Competing same-facing model surfaces'):
                guard.check()


if __name__ == '__main__':
    unittest.main()
