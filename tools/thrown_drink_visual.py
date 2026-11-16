"""Compile the current Java thrown-item sprite, not the placed bottle model.

One shared shell uses alpha-masked side-span tiles. These preserve Java's
min/max ItemModelGenerator spans, including gaps; no contour simplification.
The 0.5 GROUND scale and +2 Y translation are baked into model coordinates.
The body bone uses the official custom-projectile billboard camera transform,
including subtraction of the entity body yaw (unlike the native snowball actor).
"""
import copy
import io
import json
from PIL import Image
from java_geometry import resource_path

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


def bottle_item_sources(root):
    aliases = read(root/'data/java-parity/neoforge-1.1.11/reference.json')['source_aliases']
    sources = {}
    for path in (root/'upstream/data/kaleidoscope_world_liquor/recipe/barrel').glob('*.json'):
        item = read(path)['result']['id']
        sources[aliases.get(item, item)] = item
    return sorted(sources.items())


def source_frames(root, item_sources):
    assets = root / 'upstream/assets'
    result = []
    for item, java_item in item_sources:
        model = read(resource_path(java_item.replace(':', ':item/', 1), 'models', assets))
        assert model['parent'] in ('item/generated', 'minecraft:item/generated'), item
        assert set(model) == {'parent', 'textures'}, item
        assert set(model['textures']) == {'layer0'}, item
        frame = Image.open(resource_path(model['textures']['layer0'], 'textures', assets)).convert('RGBA')
        assert frame.size == (16, 16), item
        result.append((item, frame))
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


def generate(root, item_sources):
    frames = source_frames(root, item_sources)
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
    for name, data in output.items():
        path = root / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
