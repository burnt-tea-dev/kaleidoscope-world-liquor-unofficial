"""Canonical wall-record geometry, without changing persisted facing/model states."""
import json
from pathlib import Path


def normalize(path: Path) -> None:
    data = json.loads(path.read_text(encoding='utf-8'))
    block = data['minecraft:block']
    assert block['description']['identifier'] == 'kaleidoscope_world_liquor:wall_record'
    # Original mesh is on +Z, looking north. For N/E/S/W its backing face
    # must remain S/W/N/E respectively. Selection/collision rotate together.
    block['components']['minecraft:transformation'] = {'rotation': [0, 0, 0]}
    for entry in block['permutations']:
        if 'minecraft:transformation' not in entry['components']:
            continue
        facing = next((f for f in range(1, 4) if entry['condition'] ==
                       f"q.block_state('kaleidoscope_tavern:facing') == {f}"), None)
        if facing is None:
            raise ValueError('Unexpected wall-record orientation condition')
        entry['components']['minecraft:transformation'] = {'rotation': [0, (-90*facing) % 360, 0]}
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2)+'\n', encoding='utf-8', newline='\n')


def historical_view(actual: bytes, projected: bytes) -> tuple[str, bytes]:
    """Compose this four-rotation repair with existing historical projections.

    Both the exact new bytes and the restored old bytes are checked; this is
    not a whitelist that accepts other changes to the record definition.
    """
    import hashlib
    before = "8224aff94108baf155eefb69b73b0b976d17603f136eb79becb4d51f7cad3478"
    after = "ff7e33d524a3e49bebb40168c5d5f86f724640740bb6a9e2ba2e6ce7a2f09037"
    assert hashlib.sha256(actual).hexdigest() == after, 'Unreviewed wall-record mutation'

    def restore(raw):
        value = json.loads(raw)
        block = value['minecraft:block']
        block['components']['minecraft:transformation']['rotation'][1] = 180
        for entry in block['permutations']:
            transform = entry['components'].get('minecraft:transformation')
            if transform:
                transform['rotation'][1] = (transform['rotation'][1] + 180) % 360
        return (json.dumps(value, ensure_ascii=False, indent=2)+'\n').encode()

    assert hashlib.sha256(restore(actual)).hexdigest() == before, 'Wall-record baseline mismatch'
    return before, restore(projected)
