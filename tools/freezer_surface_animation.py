"""Source-driven freezer texture animation; never changes recipes or storage.

The original strip images remain the source of every texel. Entity textures do
not enter the terrain flipbook atlas, so the client render controller must select
their frames explicitly. USE_UV_ANIM is required by the inherited materials.
"""
import argparse
import hashlib
import io
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
REVIEW = ROOT / 'data/freezer-surface-animation.json'
RP = ROOT / 'runtime/RP'


def read(path):
    return json.loads(path.read_text())


def encoded(value):
    return (json.dumps(value, ensure_ascii=False, indent=2) + '\n').encode()


def source_bytes(entry):
    data = (ROOT / entry['path']).read_bytes()
    assert hashlib.sha256(data).hexdigest() == entry['sha256'], entry['path']
    return data


def interpolated_strip(image, frames, ticks):
    """Java opaque legacy magma: discrete tick uploads of RGB interpolation.

    Its three original frames are opaque, so Java's retained current-frame alpha
    and interpolation of RGB channels have no alpha ambiguity. No authored color
    or frame ordering is invented. Keep the original strip separately unchanged.
    """
    image = image.convert('RGBA')
    assert image.width == 16 and image.getchannel('A').getextrema() == (255, 255)
    result = Image.new('RGBA', (16, 16 * len(frames) * ticks))
    for index, frame in enumerate(frames):
        left = image.crop((0, frame * 16, 16, (frame + 1) * 16))
        following = frames[(index + 1) % len(frames)]
        right = image.crop((0, following * 16, 16, (following + 1) * 16))
        for tick in range(ticks):
            blended = Image.new('RGBA', (16, 16))
            blended.putdata([
                tuple((a[channel] * (ticks - tick) + b[channel] * tick) // ticks
                      for channel in range(3)) + (255,)
                for a, b in zip(left.getdata(), right.getdata())
            ])
            result.paste(blended, (0, (index * ticks + tick) * 16))
    output = io.BytesIO()
    result.save(output, format='PNG')
    return output.getvalue()


def frame_expression(frames, ticks):
    clock = f'math.mod(math.floor(q.time_stamp / {ticks}), {len(frames)})'
    if frames == list(range(len(frames))):
        return clock
    # Original lava0..19..1: do not replace its ping-pong with a32-frame loop.
    top = max(frames)
    assert frames == list(range(top + 1)) + list(range(top - 1, 0, -1))
    return f'({clock} <= {top} ? {clock} : {len(frames)} - {clock})'


def planned():
    outputs = {}
    materials = {'version': '1.0.0'}
    for row in read(REVIEW)['sprites']:
        kind = row['kind']
        png = source_bytes(row['image'])
        image = Image.open(io.BytesIO(png))
        animation = json.loads(source_bytes(row['metadata']))['animation']
        count = image.height // image.width
        assert image.width == 16 and image.height == 16 * count
        ticks = animation.get('frametime', 1)
        frames = animation.get('frames', list(range(count)))
        assert type(ticks) is int and ticks > 0
        assert frames and all(type(frame) is int and 0 <= frame < count for frame in frames)
        texture = 'textures/repair/freezer_' + kind
        if animation.get('interpolate', False):
            assert kind == 'magma', 'Review a new interpolation source explicitly'
            texture += '_interpolated'
            outputs[RP / (texture + '.png')] = interpolated_strip(image, frames, ticks)
            texture_set = read(RP / 'textures/repair/freezer_magma.texture_set.json')
            texture_set['minecraft:texture_set']['color'] = Path(texture).name
            outputs[RP / (texture + '.texture_set.json')] = encoded(texture_set)
            count = len(frames) * ticks
            frames, ticks = list(range(count)), 1
        else:
            outputs[RP / (texture + '.png')] = png

        client_path = RP / f'entity/freezer_{kind}.entity.json'
        client = read(client_path)
        description = client['minecraft:client_entity']['description']
        # Re-running the authoring tool must not derive a material from itself.
        original_material = 'entity_alphablend' if kind in ('water', 'lava', 'milk_still') else 'entity_alphatest'
        material = 'kwl_freezer_animated_' + original_material.removeprefix('entity_')
        materials[material + ':' + original_material] = {'+defines': ['USE_UV_ANIM']}
        description['materials']['default'] = material
        description['textures']['default'] = texture
        outputs[client_path] = encoded(client)

        geometry_path = RP / f'models/entity/freezer_{kind}.geo.json'
        geometry = read(geometry_path)
        geometry['minecraft:geometry'][0]['description']['texture_height'] = count * 16
        outputs[geometry_path] = encoded(geometry)
        controller_path = RP / f'render_controllers/freezer_{kind}.json'
        controller = read(controller_path)
        definition = controller['render_controllers'][f'controller.render.kwl.freezer_{kind}']
        if kind == 'water':
            # FreezerRenderer uses vertex alpha1; alpha already lives in the
            # original water texels. The old .82 tinted a second opacity factor.
            definition['color']['a'] = 1
        definition['uv_anim'] = {
            'offset': [0, f'({frame_expression(frames, ticks)}) / {count}'],
            'scale': [1, 1],
        }
        outputs[controller_path] = encoded(controller)
    # Entity materials use the client's standard entity registry entry. An
    # arbitrary .material basename is not an entity material load declaration.
    outputs[RP / 'materials/entity.material'] = encoded({'materials': materials})
    return outputs


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--write', action='store_true')
    args = parser.parse_args()
    differences = []
    for path, data in planned().items():
        if path.is_file() and path.read_bytes() == data:
            continue
        if args.write:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(data)
        else:
            differences.append(path.relative_to(ROOT).as_posix())
    assert not differences, ('Missing or drifted freezer animation route', differences)
    print('Four source-backed freezer sheets have explicit client frame selection; client acceptance pending')


if __name__ == '__main__':
    main()
