#!/usr/bin/env python3
import copy
import importlib.util
import json
import os
from pathlib import Path
import unittest
from collision_shapes import ROOT, WITNESS, box_bounds, check_shapes

TAV = Path(os.environ.get('TAVERN_ROOT', str(ROOT.parent / 'tavern-src')))
spec = importlib.util.spec_from_file_location('collision_shape_projection', TAV / 'tools/collision_shape_projection.py')
projection = importlib.util.module_from_spec(spec)
spec.loader.exec_module(projection)


class CollisionShapesTest(unittest.TestCase):
    def test_all_original_shapes_and_freezer_rotations(self):
        self.assertEqual(check_shapes(), 34)

    def test_each_current_delta_preserves_every_other_immutable_source_field(self):
        for name in json.loads(WITNESS.read_text())['changed_blocks']:
            path = 'runtime/BP/blocks/' + name
            actual = (ROOT / path).read_bytes()
            self.assertEqual(projection.collision_preimage(ROOT, path, actual),
                             projection.immutable_before(str(ROOT.resolve()), projection.WORLD_PREVIOUS, path))

    def test_shape_broadening_or_other_gameplay_mutations_are_rejected(self):
        for name in ('freezer.json', 'cup_gin_tonic.json', 'bar_stool_black.json',
                     'oak_bar_cabinet.json', 'oak_cellar_cabinet.json'):
            path = 'runtime/BP/blocks/' + name
            original = json.loads((ROOT / path).read_text())
            for field in ('minecraft:collision_box', 'minecraft:tick'):
                changed = copy.deepcopy(original)
                changed['minecraft:block']['components'][field] = True
                with self.assertRaises(AssertionError):
                    projection.collision_preimage(ROOT, path, json.dumps(changed).encode())

    def test_chair_has_open_air_beside_column_and_support_under_seat(self):
        block = json.loads((ROOT / 'runtime/BP/blocks/bar_stool_black.json').read_text())['minecraft:block']
        boxes = [box_bounds(box) for box in block['components']['minecraft:collision_box']]
        inside = lambda point: any(all(bounds[i] < point[i] < bounds[i + 3] for i in range(3)) for bounds in boxes)
        self.assertFalse(inside([3, 6, 3]))  # old single AABB blocked this empty space
        self.assertTrue(inside([8, 6, 8]))
        self.assertTrue(inside([4, 13, 4]))
        self.assertTrue(inside([3, .5, 3]))


if __name__ == '__main__':
    unittest.main()
