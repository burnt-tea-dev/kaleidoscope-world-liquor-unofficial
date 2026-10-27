"""Current Java effect/resource contracts; no reconstruction of older payloads."""
import copy
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
NS = 'kaleidoscope_world_liquor:'
CURRENT_SOURCES = {'runtime/BP/scripts/content.js', 'runtime/BP/scripts/payload.js'}


def readjs(path):
    return json.loads(path.read_text().split('=', 1)[1].strip().rstrip(';'))


def normalize(value):
    if isinstance(value, str):
        return value.replace('smc:', NS)
    if isinstance(value, list):
        return [normalize(row) for row in value]
    if isinstance(value, dict):
        return {key: normalize(row) for key, row in value.items()}
    return value


def check_documents(content, payload, root=ROOT):
    upstream = root / 'upstream'
    sources = {}
    for path in (upstream / 'data').glob('*/datamap/drink_effect/*.json'):
        row = normalize(json.loads(path.read_text()))
        sources[row['item']] = row['effects']
    highball = json.loads((root / 'data/java-parity/neoforge-1.1.11/reference.json').read_text())['highball_effects']
    sources[highball['item']] = highball['effects']
    bottles = sorted({normalize(json.loads(path.read_text())['result']['id'])
                      for path in (upstream / 'data/kaleidoscope_world_liquor/recipe/barrel').glob('*.json')})
    cocktails = sorted({normalize(json.loads(path.read_text())['result']['id'])
                        for path in (upstream / 'data/kaleidoscope_world_liquor/recipe/shaker').glob('*.json')
                        if normalize(json.loads(path.read_text())['result']['id']).startswith(NS)})
    registered = copy.deepcopy(payload['content'])
    for row in registered:
        row.pop('color', None)  # Java tag/color membership has its own current generator.
    # The legacy data export has no runtime importers; Highball was added to
    # the production registration directly. Preserve that existing distinction.
    assert content == [row for row in registered if row.get('item') != NS + 'highball'], 'Legacy and registered drink descriptors differ'
    ids = [row.get('base', row.get('item')) for row in registered]
    assert len(ids) == len(set(ids)) and set(ids) == set(bottles + cocktails), 'Java drink inventory differs'
    assert ids[:len(bottles)] == bottles, 'Persisted bottle visual indices differ'
    blocked = normalize(json.loads((upstream / 'data/kaleidoscope_tavern/tags/item/cellar_cabinet_blocklist.json').read_text())['values'])
    for index, row in enumerate(registered):
        item = ids[index]
        short = item.split(':')[1]
        effects = sources[item] if item in bottles else sources[item][0]
        assert row['effects'] == effects, ('Current Java effect table differs', item)
        block = NS + ('bottle_' if item in bottles else 'cup_') + short
        assert row['block'] == block
        assert json.loads((root / 'runtime/BP/blocks' / (block.split(':')[1] + '.json')).read_text())['minecraft:block']['description']['identifier'] == block
        if item in bottles:
            assert row['kind'] == 'bottle' and row['items'] == [item + '_q' + str(q) for q in range(1, 7)]
            variants = json.loads((upstream / 'assets/kaleidoscope_world_liquor/blockstates' / (short + '.json')).read_text())['variants']
            counts = [int(dict(pair.split('=') for pair in key.split(','))['count']) for key in variants]
            assert row['maxCount'] == max(counts) and row['compact'] == (item not in blocked)
            assert row['visualKind'] == 1000 + index
            assert row['visuals'] == {key: NS + key for key in ['holder_bottle_visual', 'cellar_cabinet_bottle_visual', 'tilted_rack_bottle_visual', 'circular_rack_bottle_visual', 'bar_cabinet_bottle_visual', 'thrown_drink']}
        else:
            assert row['kind'] == 'cocktail'
    for row in payload['shakerInputs']:
        item = row['item']
        base, _, grade = item.rpartition('_q')
        if base in bottles:
            assert row['effects'] == sources[base][int(grade) - 1], ('Signature effect differs', item)
    review = json.loads((root / 'data/current-author-review-20261027.json').read_text())
    for branch in review['branches']:
        assert hashlib.sha256((upstream / branch['selected_member']).read_bytes()).hexdigest() == branch['selected_member_sha256']
    return {'drinks': len(content), 'source_effect_tables': 'passed', 'storage_descriptors': 'passed', 'registration': 'passed', 'client': False}


def check(root=ROOT):
    return check_documents(readjs(root / 'runtime/BP/scripts/content.js'), readjs(root / 'runtime/BP/scripts/payload.js'), root)


if __name__ == '__main__':
    print(json.dumps(check()))
