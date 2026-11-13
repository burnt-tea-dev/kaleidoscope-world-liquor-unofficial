"""Compile the current Java thrown-item sprite, not the placed bottle model.

One shared shell uses alpha-masked side-span tiles. These preserve Java's
min/max ItemModelGenerator spans, including gaps; no contour simplification.
The 0.5 GROUND scale and +2 Y translation are baked into model coordinates.
The body bone uses the official custom-projectile billboard camera transform,
including subtraction of the entity body yaw (unlike the native snowball actor).
"""
import argparse
import copy
import hashlib
import io
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
GEO = 'geometry.kwl.thrown_drink_sprite'
ENTITY = 'runtime/RP/entity/thrown_drink.entity.json'
GEOMETRY = 'runtime/RP/models/entity/kwl_thrown_drink_sprite.geo.json'
ANIMATION = 'runtime/RP/animations/thrown_drink.animation.json'
TILES = {'up': (16, 0), 'down': (32, 0), 'west': (48, 0), 'east': (0, 16)}
OUTER = {('up', 0), ('down', 15), ('west', 0), ('east', 15)}


def read(path):
    return json.loads(path.read_text())


def encoded(value):
    return (json.dumps(value, ensure_ascii=False, indent=2) + '\n').encode()


def source_frames(root):
    source = read(root / 'data/thrown-drink-source/source.json')
    assert source['ground'] == {'rotation': [0, 0, 0], 'translation': [0, 2, 0], 'scale': [.5, .5, .5]}
    assert [row['item'] for row in source['items']] == read(root / 'docs/item-inventory.json')['bottles']
    result = []
    for row in source['items']:
        assert row['definition']['parent'] in ('item/generated', 'minecraft:item/generated')
        assert set(row['definition']) == {'parent', 'textures'}
        assert set(row['definition']['textures']) == {'layer0'}
        raw = (root / row['runtime_texture']).read_bytes()
        assert hashlib.sha256(raw).hexdigest() == row['texture_sha256'], row['item']
        frame = Image.open(io.BytesIO(raw)).convert('RGBA')
        assert frame.size == (16, 16), row['item']
        result.append((row['item'], frame))
    assert len(result) == 18
    return result


def spans(frame):
    """Java merges all boundary pixels at each face/row or column anchor."""
    result = {}
    for y in range(16):
        for x in range(16):
            if not frame.getpixel((x, y))[3]:
                continue
            for facing, dx, dy in [('up', 0, -1), ('down', 0, 1), ('west', -1, 0), ('east', 1, 0)]:
                nx, ny = x + dx, y + dy
                if 0 <= nx < 16 and 0 <= ny < 16 and frame.getpixel((nx, ny))[3]:
                    continue
                anchor, along = (y, x) if dy else (x, y)
                lo, hi = result.get((facing, anchor), (along, along))
                result[(facing, anchor)] = min(lo, along), max(hi, along)
    return result


def atlas(frame, source_spans):
    result = Image.new('RGBA', (64, 32))
    result.paste(frame, (0, 0))
    for (facing, anchor), (lo, hi) in source_spans.items():
        tx, ty = TILES[facing]
        for along in range(lo, hi + 1):
            x, y = (along, anchor) if facing in ('up', 'down') else (anchor, along)
            result.putpixel((tx + x, ty + y), frame.getpixel((x, y)))
    return result


def box(x0, x1, y0, y1, faces, broad=False):
    # Bedrock's cube codec reflects X; decoded Java/editor X is x/2 - 4.
    cube = {'origin': [4 - x1 / 2, 6 - y1 / 2, -.25],
            'size': [(x1 - x0) / 2, (y1 - y0) / 2, .5], 'uv': {}}
    if broad:
        cube['uv'].update({'north': {'uv': [16, 0], 'uv_size': [-16, 16]},
                           'south': {'uv': [0, 0], 'uv_size': [16, 16]}})
    for facing, anchor in faces:
        tx, ty = TILES[facing]
        cube['uv'][facing] = ({'uv': [tx + x1, ty + anchor + 1], 'uv_size': [x0 - x1, -1]}
                              if facing in ('up', 'down') else
                              {'uv': [tx + anchor, ty + y0], 'uv_size': [1, y1 - y0]})
    return cube


def shell(required):
    required = set(required)
    cubes = [box(0, 16, 0, 16, sorted(OUTER & required), broad=True)]
    remaining = required - OUTER
    for i in range(16):
        faces = remaining & {('up', i), ('down', i)}
        if faces:
            cubes.append(box(0, 16, i, i + 1, sorted(faces)))
    for i in range(16):
        faces = remaining & {('west', i), ('east', i)}
        if faces:
            cubes.append(box(i, i + 1, 0, 16, sorted(faces)))
    return {'format_version': '1.21.0', 'minecraft:geometry': [{
        'description': {'identifier': GEO, 'texture_width': 64, 'texture_height': 32,
                        'visible_bounds_width': 2, 'visible_bounds_height': 2,
                        'visible_bounds_offset': [0, 0, 0]},
        'bones': [{'name': 'body', 'pivot': [0, 0, 0], 'cubes': cubes}]}]}


def configure_entity(entity, bottle_ids):
    result = copy.deepcopy(entity)
    d = result['minecraft:client_entity']['description']
    d['geometry'] = {f'kind_{i}': GEO for i in range(len(bottle_ids))}
    d['textures'] = {f'kind_{i}': 'textures/kwl/projectiles/' + item.split(':')[1]
                     for i, item in enumerate(bottle_ids)}
    # GROUND transform is in the geometry, so the old placed-block 0.6 scale
    # must not survive. The BP kind range, flight and impact behavior stay intact.
    d['scripts'] = {'animate': ['flying']}
    d['animations'] = {'flying': 'animation.kwl.thrown_drink.billboard'}
    return result


def planned(root=ROOT):
    frames = source_frames(root)
    shapes = {name: spans(frame) for name, frame in frames}
    required = set().union(*(set(shape) for shape in shapes.values()))
    output = {GEOMETRY: encoded(shell(required))}
    for name, frame in frames:
        buffer = io.BytesIO()
        atlas(frame, shapes[name]).save(buffer, format='PNG')
        output['runtime/RP/textures/kwl/projectiles/' + name.split(':')[1] + '.png'] = buffer.getvalue()
    output[ENTITY] = encoded(configure_entity(read(root / ENTITY), [name for name, _ in frames]))
    output[ANIMATION] = encoded({'format_version': '1.8.0', 'animations': {
        'animation.kwl.thrown_drink.billboard': {'loop': True, 'bones': {
            'body': {'rotation': ['query.camera_rotation(0)', 'query.camera_rotation(1) - query.body_y_rotation', 0.0]}}}}})
    return output


def check(root=ROOT, write=False):
    output = planned(root)
    for name, data in output.items():
        path = root / name
        if write:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(data)
        assert path.read_bytes() == data, name
    d = read(root / ENTITY)['minecraft:client_entity']['description']
    assert d['identifier'] == 'kaleidoscope_world_liquor:thrown_drink'
    assert d['materials'] == {'default': 'entity_alphatest_one_sided'}
    assert d['render_controllers'] == ['controller.render.kwl.thrown_drink']
    controller = read(root / 'runtime/RP/render_controllers/thrown_drink.json')['render_controllers'][d['render_controllers'][0]]
    assert controller['arrays']['geometries']['Array.models'] == [f'Geometry.kind_{i}' for i in range(18)]
    assert controller['arrays']['textures']['Array.textures'] == [f'Texture.kind_{i}' for i in range(18)]
    assert controller['geometry'] == "Array.models[math.clamp(q.property('kaleidoscope_tavern:storage_kind') - 1000, 0, 17)]"
    assert controller['textures'] == ["Array.textures[math.clamp(q.property('kaleidoscope_tavern:storage_kind') - 1000, 0, 17)]"]
    assert controller['materials'] == [{'*': 'Material.default'}]
    bp = read(root/'runtime/BP/entities/thrown_drink.json')['minecraft:entity']['description']
    assert bp['properties']['kaleidoscope_tavern:storage_kind'] == {
        'type': 'int', 'range': [1000, 1017], 'default': 1000, 'client_sync': True}
    return output


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--write', action='store_true')
    args = parser.parse_args()
    check(write=args.write)
    print('18 thrown-item sprite routes match current source; native client appearance not verified')
