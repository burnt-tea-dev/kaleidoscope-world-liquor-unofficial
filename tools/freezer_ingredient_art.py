"""Own the official dye artwork and identical fixed freezer sprite surfaces."""
import argparse
import hashlib
import json
from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parents[1]
REVIEW = ROOT / 'data/freezer-ingredient-art.json'
TARGET = 'runtime/RP/textures/repair/freezer_blue_dye.png'
ASSETS = {
    'assets/minecraft/textures/item/blue_dye.png': '6cf7ce48373b5e4d1b42c36abdff0abc847eef2dd10c9886bc1a77903b66617d',
    'assets/minecraft/models/item/blue_dye.json': '1f63a2badaf341c49903d29d950aeca0243620a8f421adcde620ea21ec07a96c',
}


def read(path):
    return json.loads(path.read_text())



# These sprites already have the same full geometry document apart from ID.
# Keep the established blue-dye ID; textures, entities, shader and BP identity
# remain independent. This is not a global or approximate mesh deduplicator.
SHARED_SPRITES = ('slime_ball', 'snowball')
SHARED_GEOMETRY = 'geometry.kwl.freezer_blue_dye'


def shared_geometry_paths():
    return frozenset(path for name in SHARED_SPRITES for path in (
        f'runtime/RP/entity/freezer_{name}.entity.json',
        f'runtime/RP/models/entity/freezer_{name}.geo.json'))


def normalize_shared_geometry(write=False, root=ROOT):
    expected = {'format_version': '1.21.0', 'minecraft:geometry': [{
        'description': {'identifier': SHARED_GEOMETRY, 'texture_width': 16,
                        'texture_height': 16, 'visible_bounds_width': 2,
                        'visible_bounds_height': 2, 'visible_bounds_offset': [0, .5, 0]},
        'bones': [{'name': 'surface', 'pivot': [0, 0, 0], 'cubes': [{
            'origin': [-2, 0, -2], 'size': [4, 0, 4],
            'uv': {'up': {'uv': [0, 0], 'uv_size': [16, 16]}}}]}]}]}
    assert read(root/'runtime/RP/models/entity/freezer_blue_dye.geo.json') == expected, 'Shared freezer surface changed'
    additions = read(root/'data/freezer-visual-additions.json')['files']
    for name in SHARED_SPRITES:
        path = root/f'runtime/RP/models/entity/freezer_{name}.geo.json'
        if path.exists():
            actual = read(path)
            assert actual['minecraft:geometry'][0]['description']['identifier'] == f'geometry.kwl.freezer_{name}'
            actual['minecraft:geometry'][0]['description']['identifier'] = SHARED_GEOMETRY
            assert actual == expected, ('Freezer surfaces are not fully equivalent', name)
            assert write, ('Redundant freezer geometry remains', name)
        entity_path = root/f'runtime/RP/entity/freezer_{name}.entity.json'
        entity = {'format_version': '1.10.0', 'minecraft:client_entity': {'description': {
            'identifier': f'kaleidoscope_world_liquor:freezer_{name}_visual',
            'materials': {'default': 'entity_alphatest'},
            'textures': {'default': f'textures/repair/freezer_{name}'},
            'geometry': {'default': SHARED_GEOMETRY},
            'render_controllers': [f'controller.render.kwl.freezer_{name}']}}}
        actual = read(entity_path)
        if write:
            original = json.loads(json.dumps(entity))
            original['minecraft:client_entity']['description']['geometry']['default'] = f'geometry.kwl.freezer_{name}'
            assert actual in (original, entity), ('Unexpected freezer client changes', name)
            entity_path.write_text(json.dumps(entity, indent=2)+'\n')
            if path.exists():
                path.unlink()
        else:
            assert actual == entity, ('Shared freezer binding differs', name)
        # All visible pixels and shader inputs remain the historical originals.
        for suffix in ('.png', '.texture_set.json'):
            relative = f'runtime/RP/textures/repair/freezer_{name}{suffix}'
            assert hashlib.sha256((root/relative).read_bytes()).hexdigest() == additions[relative]
        controller = read(root/f'runtime/RP/render_controllers/freezer_{name}.json')['render_controllers'][f'controller.render.kwl.freezer_{name}']
        assert controller == {'geometry': 'Geometry.default', 'materials': [{'*': 'Material.default'}], 'textures': ['Texture.default']}
    return shared_geometry_paths()


def source_bytes(jar):
    review = read(REVIEW)
    assert review['target'] == TARGET and review['source']['minecraft'] == '1.21.1'
    assets = review['source']['assets']
    assert set(assets) == set(ASSETS)
    blob = Path(jar).read_bytes()
    assert hashlib.sha1(blob).hexdigest() == '30c73b1c5da787909b2f73340419fdf13b9def88'
    assert hashlib.sha256(blob).hexdigest() == '499f6897d1837516680f3114072d8106e11c9adcd933fe5cf051b551089b0c99'
    contents = {}
    with zipfile.ZipFile(jar) as archive:
        for name, digest in ASSETS.items():
            data = archive.read(name)
            assert assets[name]['sha256'] == hashlib.sha256(data).hexdigest() == digest, name
            contents[name] = data
    return contents['assets/minecraft/textures/item/blue_dye.png']


def check(write=False, jar=None):
    target = ROOT / TARGET
    assert not write or jar, '--write requires the pinned official --jar source'
    data = source_bytes(jar) if jar else target.read_bytes()
    assert hashlib.sha256(data).hexdigest() == ASSETS['assets/minecraft/textures/item/blue_dye.png'], 'Freezer blue dye is not the official item sprite'
    if write:
        target.write_bytes(data)
    assert target.read_bytes() == data
    # This renderer reads the image alpha directly; it has no old item outline
    # baked into an extruded mesh which could survive the source correction.
    entity = read(ROOT / 'runtime/RP/entity/freezer_blue_dye.entity.json')['minecraft:client_entity']['description']
    assert entity['textures']['default'] == 'textures/repair/freezer_blue_dye'
    assert entity['materials']['default'] == 'entity_alphatest'
    geometry = read(ROOT / 'runtime/RP/models/entity/freezer_blue_dye.geo.json')['minecraft:geometry'][0]
    assert entity['geometry']['default'] == geometry['description']['identifier']
    cubes = [cube for bone in geometry['bones'] for cube in bone.get('cubes', [])]
    assert len(cubes) == 1 and cubes[0]['size'] == [4, 0, 4]
    assert cubes[0]['uv'] == {'up': {'uv': [0, 0], 'uv_size': [16, 16]}}
    normalize_shared_geometry(write=write)
    return {TARGET: hashlib.sha256(data).hexdigest()}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--write', action='store_true')
    parser.add_argument('--share-geometry', action='store_true', help='Normalize only the proven equal fixed sprite geometry bindings')
    parser.add_argument('--jar', type=Path, help='Also verify against the pinned official client archive')
    args = parser.parse_args()
    if args.share_geometry:
        normalize_shared_geometry(write=True)
    check(args.write, args.jar)
    print('Freezer blue dye matches official Minecraft 1.21.1 item pixels; client rendering unverified')
