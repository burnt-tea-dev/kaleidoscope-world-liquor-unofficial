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
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
