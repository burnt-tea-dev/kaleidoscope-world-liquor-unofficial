#!/usr/bin/env python3
"""Original Java block shape facts versus exported physical/selection boxes."""
import argparse
import hashlib
import json
import math
from pathlib import Path
import re
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parents[1]
WITNESS = ROOT / 'data/java-collision-shapes-20261016.json'


def box_bounds(box):
    assert isinstance(box, dict), ('Expected an enabled source box', box)
    lo = [box['origin'][0] + 8, box['origin'][1], box['origin'][2] + 8]
    return lo + [lo[i] + box['size'][i] for i in range(3)]


def rotated(bounds, angle):
    assert angle % 90 == 0
    turns = int(angle / 90) % 4
    corners = []
    for source_x in (bounds[0], bounds[3]):
        for source_z in (bounds[2], bounds[5]):
            x, z = source_x - 8, source_z - 8
            for _ in range(turns):
                x, z = z, -x
            corners.append((x + 8, z + 8))
    return [min(p[0] for p in corners), bounds[1], min(p[1] for p in corners),
            max(p[0] for p in corners), bounds[4], max(p[1] for p in corners)]


def check_shapes(root=ROOT, witness=None):
    witness = witness or json.loads(WITNESS.read_text())
    count = 0
    for name in witness['changed_blocks']:
        block = json.loads((Path(root) / 'runtime/BP/blocks' / name).read_text())['minecraft:block']
        components = block['components']
        if name == 'freezer.json':
            expected = witness['author_shapes']['freezer_north']
            assert box_bounds(components['minecraft:collision_box']) == expected
            assert box_bounds(components['minecraft:selection_box']) == expected
            facings = {0: 0}
            for permutation in block['permutations']:
                assert 'minecraft:collision_box' not in permutation['components']
                assert 'minecraft:selection_box' not in permutation['components']
                transform = permutation['components'].get('minecraft:transformation')
                if transform:
                    index = int(re.fullmatch(r"q.block_state\('kaleidoscope_tavern:facing'\) == ([123])", permutation['condition'])[1])
                    assert set(transform) == {'rotation'} and transform['rotation'][0] == transform['rotation'][2] == 0
                    facings[index] = transform['rotation'][1]
            assert set(facings) == {0, 1, 2, 3}
            for index, facing in enumerate(('north', 'east', 'south', 'west')):
                assert rotated(expected, facings[index]) == witness['freezer_facing_bounds'][facing]
        elif name.startswith('cup_'):
            expected = witness['author_shapes']['cocktail_inherited_glassware']
            assert box_bounds(components['minecraft:collision_box']) == expected
            assert box_bounds(components['minecraft:selection_box']) == expected
        elif name.endswith('_cabinet.json'):
            expected = witness['author_shapes']['cellar_cabinet_safe' if name.endswith('_cellar_cabinet.json') else 'bar_cabinet_safe']
            for field in ('minecraft:collision_box', 'minecraft:selection_box'):
                assert all(math.isclose(actual, original, rel_tol=0, abs_tol=1e-12)
                           for actual, original in zip(box_bounds(components[field]), expected))
        else:
            actual = components['minecraft:collision_box']
            assert isinstance(actual, list) and len(actual) == 3
            assert [box_bounds(box) for box in actual] == witness['author_shapes']['chair_union']
            assert box_bounds(components['minecraft:selection_box']) == [2, 0, 2, 14, 15, 14]
        count += 1
    assert count == 34 and len(set(witness['changed_blocks'])) == 34
    return count


def bytecode_boxes(text):
    values, result = [], []
    for line in text.split('  static {};', 1)[1].splitlines():
        match = re.search(r'\bdconst_([01])\b', line) or re.search(r'// double (-?[\d.]+)d', line)
        if match:
            values.append(float(match[1]))
        if 'Method net/minecraft/world/level/block/Block.box:(DDDDDD)' in line:
            assert len(values) == 6, values
            result.append(values)
            values = []
    return result


def check_author_archive(path):
    witness = json.loads(WITNESS.read_text())
    archive = witness['author_archive']
    assert hashlib.sha256(Path(path).read_bytes()).hexdigest() == archive['sha256']
    with zipfile.ZipFile(path) as source:
        for name, digest in archive['class_members'].items():
            assert hashlib.sha256(source.read(name)).hexdigest() == digest, name
    decoded = {}
    for short in ('FreezerBlock', 'ChairBlock', 'BarCabinetBlock', 'BarCellarCabinetBlock'):
        decoded[short] = subprocess.check_output(['javap', '-classpath', str(path), '-c', '-p',
            'com.bmt.kaleidoscope_world_liquor.block.' + short], text=True)
    assert bytecode_boxes(decoded['FreezerBlock']) == [witness['author_shapes']['freezer_north']]
    assert bytecode_boxes(decoded['ChairBlock']) == witness['author_shapes']['chair_union']
    assert 'VoxelShapeUtils.horizontalShapes' in decoded['FreezerBlock']
    assert 'getCollisionShape(' not in decoded['FreezerBlock']
    assert 'getCollisionShape(' not in decoded['ChairBlock']
    assert bytecode_boxes(decoded['BarCabinetBlock']) == [witness['author_shapes']['bar_cabinet_safe']]
    assert 'getCollisionShape(' not in decoded['BarCabinetBlock']
    assert bytecode_boxes(decoded['BarCellarCabinetBlock']) == [witness['author_shapes']['cellar_cabinet_safe']]
    assert 'getCollisionShape(' not in decoded['BarCellarCabinetBlock']


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--author-archive', type=Path)
    args = parser.parse_args()
    count = check_shapes()
    if args.author_archive:
        check_author_archive(args.author_archive)
    print(json.dumps({'sourceBackedBlockShapes': count, 'authorArchiveChecked': args.author_archive is not None,
                      'chairSelection': 'single union AABB', 'client': False}))


if __name__ == '__main__':
    main()
