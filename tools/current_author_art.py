"""Convert only the current author's cabinets and pendant lamps.

Existing cabinet block/state/storage identities and item poses remain in place.
The original port compiler is not rerun over unrelated gameplay repairs.
"""
import argparse
import copy
import hashlib
import json
from pathlib import Path
import tempfile

import java_geometry as java

ROOT = Path(__file__).resolve().parents[1]
NS = 'kaleidoscope_world_liquor'
RP = ROOT / 'runtime/RP'
BP = ROOT / 'runtime/BP'
SOURCE = ROOT / 'upstream/assets'


def read(path):
    return json.loads(path.read_text())


def encoded(value):
    return (json.dumps(value, ensure_ascii=False, indent=2) + '\n').encode()


def verify_source():
    evidence = read(ROOT / 'data/current-author-assets.json')
    for name, digest in {**evidence['files'], **evidence.get('dependency_assets', {})}.items():
        assert hashlib.sha256((ROOT / 'upstream' / name).read_bytes()).hexdigest() == digest, name


def cabinet_bindings():
    for wood in ('oak', 'birch', 'spruce', 'dark_oak', 'cherry'):
        for kind in ('bar_cabinet', 'cellar_cabinet'):
            path = BP / 'blocks' / (wood + '_' + kind + '.json')
            block = read(path)['minecraft:block']
            for components in [block['components'], *[p['components'] for p in block.get('permutations', [])]]:
                if 'minecraft:geometry' not in components:
                    continue
                alias = components['minecraft:material_instances']['*']['texture']
                namespace, *parts = alias.removeprefix('kwl_').split('__')
                yield components['minecraft:geometry']['identifier'], alias, namespace + ':' + '/'.join(parts)


def cabinet_geometries():
    return {identifier for identifier, _, _ in cabinet_bindings()}


def planned():
    verify_source()
    outputs = {}
    terrain = read(RP / 'textures/terrain_texture.json')
    geometries = {g['description']['identifier']: p for p in (RP / 'models').rglob('*.json')
                  for g in read(p).get('minecraft:geometry', [])}

    def convert(model_id, identifier, alias):
        model = java.resolve_model(model_id, SOURCE)
        for element in model.get('elements', []):
            rotation = element.get('rotation', {})
            assert not rotation.get('rescale'), ('Unreviewed rescaled model', model_id)
        model, _ = java.lower_mixed_axis_surfaces(model)
        model, _ = java.lower_uv_half_turns(model, allow_quarter_turns=True)
        atlas_path = RP / 'textures/kwl/generated' / (model_id.replace(':', '__').replace('/', '__') + '.png')
        with tempfile.TemporaryDirectory() as directory:
            temporary = Path(directory) / 'atlas.png'
            placements = java.build_atlas(model, temporary, SOURCE)
            output = java.geometry(model, identifier.removeprefix('geometry.kwl.'), placements,
                                   [[0, 0]], allow_native_uv_rotation=True)
            outputs[atlas_path] = temporary.read_bytes()
        output['format_version'] = '1.21.0'
        geometry = output['minecraft:geometry'][0]
        geometry['description']['identifier'] = identifier
        path = geometries.get(identifier, RP / 'models/entity' / (identifier.removeprefix('geometry.') + '.geo.json'))
        if path.exists():
            old = read(path)['minecraft:geometry'][0]
            if 'item_display_transforms' in old:
                geometry['item_display_transforms'] = copy.deepcopy(old['item_display_transforms'])
        for bone in geometry['bones']:
            for cube in bone.get('cubes', []):
                for face in cube['uv'].values():
                    face['material_instance'] = 'default'
        value = encoded(output)
        assert path not in outputs or outputs[path] == value, ('Shared geometry has incompatible source models', model_id)
        outputs[path] = value
        terrain['texture_data'][alias] = {'textures': atlas_path.relative_to(RP).with_suffix('').as_posix()}
        return {'identifier': identifier}, alias

    for identifier, alias, model_id in sorted(set(cabinet_bindings())):
        convert(model_id, identifier, alias)

    items = read(RP / 'textures/item_texture.json')
    template = read(ROOT.parent / 'tavern-src/runtime/BP/blocks/yellow_pendant_lamp.json')
    top_id = 'geometry.kwl.pendant_lamp_top'
    top_alias = 'kwl_pendant_lamp_top'
    convert('kaleidoscope_tavern:block/deco/yellow_pendant_lamp/top', top_id, top_alias)
    for color in ('green', 'pink'):
        short = color + '_pendant_lamp'
        identifier = 'geometry.kwl.' + short + '_bottom'
        alias = 'kwl_' + short
        convert(NS + ':block/deco/' + short + '/bottom', identifier, alias)
        block = copy.deepcopy(template)
        data = block['minecraft:block']
        data['description']['identifier'] = NS + ':' + short
        # The author's item is a generated sprite; do not substitute a 3D held model.
        data['components'].pop('minecraft:item_visual', None)
        data['components']['minecraft:geometry'] = {'identifier': top_id}
        for material in data['components']['minecraft:material_instances'].values():
            material['texture'] = top_alias
        for permutation in data.get('permutations', []):
            if "block_state('kaleidoscope_tavern:half') == 1" in permutation['condition']:
                permutation['components']['minecraft:geometry'] = {'identifier': identifier}
                for material in permutation['components']['minecraft:material_instances'].values():
                    material['texture'] = alias
            else:
                permutation['components']['minecraft:geometry'] = {'identifier': top_id}
                for material in permutation['components'].get('minecraft:material_instances', {}).values():
                    material['texture'] = top_alias
        data['components']['kaleidoscope_tavern:natural_break'] = {'drop': NS + ':' + short}
        outputs[BP / 'blocks' / (short + '.json')] = encoded(block)
        item = {'format_version': '1.26.50', 'minecraft:item': {
            'description': {'identifier': NS + ':' + short, 'menu_category': {
                'category': 'equipment', 'group': 'kaleidoscope_tavern:itemGroup.name.lighting'}},
            'components': {'minecraft:display_name': {'value': 'item.' + NS + ':' + short + '.name'},
                           'minecraft:icon': alias, 'minecraft:max_stack_size': 64,
                           'minecraft:block_placer': {'block': NS + ':' + short, 'replace_block_item': True}}}}
        outputs[BP / 'items' / (short + '.json')] = encoded(item)
        icon_path = RP / 'textures/kwl/items' / (short + '.png')
        outputs[icon_path] = (SOURCE / NS / 'textures/item' / (short + '.png')).read_bytes()
        items['texture_data'][alias] = {'textures': icon_path.relative_to(RP).with_suffix('').as_posix()}

    outputs[RP / 'textures/terrain_texture.json'] = encoded(terrain)
    outputs[RP / 'textures/item_texture.json'] = encoded(items)
    return outputs


def check(write=False):
    outputs = planned()
    for path, value in outputs.items():
        if write:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(value)
        else:
            assert path.read_bytes() == value, ('Current author resource differs', path.relative_to(ROOT))
    for color in ('green', 'pink'):
        short=color+'_pendant_lamp'
        source=read(ROOT/'upstream/data'/NS/'recipe'/(short+'.json'))
        recipe=read(BP/'recipes'/(short+'.json'))['minecraft:recipe_shaped']
        assert recipe['pattern']==source['pattern'] and recipe['key']==source['key']
        assert recipe['result']=={'item':source['result']['id'],'count':source['result']['count']}
    print('Current author cabinet geometry/atlases and two pendant lamps match source; storage identities conserved.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--write', action='store_true')
    check(parser.parse_args().write)
