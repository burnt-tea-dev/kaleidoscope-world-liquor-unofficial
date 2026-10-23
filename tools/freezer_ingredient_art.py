"""Rebuild the blue-dye surface from its exact official Java item asset."""
import argparse
import base64
import gzip
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


def historical_bytes(data):
    """Only the existing preservation checker may read the old wrong sprite."""
    row = read(REVIEW)['historicalProjection']
    assert row['testOnly'] is True
    assert hashlib.sha256(data).hexdigest() == row['after'] == ASSETS['assets/minecraft/textures/item/blue_dye.png']
    old = gzip.decompress(base64.b64decode(row['beforeGzipBase64'], validate=True))
    assert hashlib.sha256(old).hexdigest() == row['before']
    assert row['before'] == read(ROOT / 'data/freezer-visual-additions.json')['files'][TARGET]
    return old


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
    historical_bytes(data)
    print('Freezer blue dye matches official Minecraft 1.21.1 item pixels; client rendering unverified')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--write', action='store_true')
    parser.add_argument('--jar', type=Path, help='Also verify against the pinned official client archive')
    args = parser.parse_args()
    check(args.write, args.jar)
