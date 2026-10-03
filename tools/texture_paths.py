"""Canonical authoring normalization for twelve overlong texture paths.

Keep terrain keys, model identifiers and image bytes unchanged. Packaging must
only verify/copy canonical files, never apply this transformation.
"""
import argparse
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DRINKS = ('bacardi_carta_blanca', 'bamboo_leaf_green_liquor', 'bombay_sapphire_gin')
PATHS = {
    f'textures/kwl/generated/kaleidoscope_world_liquor__block__brew__drink__{drink}__count{count}':
    f'textures/kwl/generated/kwl__block__brew__drink__{drink}__count{count}'
    for drink in DRINKS for count in range(1, 5)
}

def rewrite_values(value):
    if isinstance(value, str):
        return PATHS.get(value, value)
    if isinstance(value, list):
        return [rewrite_values(v) for v in value]
    if isinstance(value, dict):
        # Keys include public terrain aliases; never rename them.
        return {k: rewrite_values(v) for k, v in value.items()}
    return value

def normalize(rp):
    rp = Path(rp)
    # Preflight every target before writing anything.
    for old, new in PATHS.items():
        source, target = rp/(old+'.png'), rp/(new+'.png')
        if source.exists() and target.exists():
            if source.read_bytes() != target.read_bytes():
                raise ValueError(f'Conflicting texture bytes: {new}')
        if not source.exists() and not target.exists():
            raise ValueError(f'Missing texture: {old}')
    for old, new in PATHS.items():
        source, target = rp/(old+'.png'), rp/(new+'.png')
        if source.exists():
            # Same-byte target can be replaced after converter regeneration.
            source.replace(target)
    changed = []
    for path in sorted(rp.rglob('*.json')):
        before = json.loads(path.read_text(encoding='utf-8-sig'))
        after = rewrite_values(before)
        if after != before:
            path.write_text(json.dumps(after, ensure_ascii=False, indent=2)+'\n')
            changed.append(path.relative_to(rp).as_posix())
    return changed

def check(rp, receipt):
    rp = Path(rp)
    for old, new in PATHS.items():
        assert not (rp/(old+'.png')).exists(), old
        target = rp/(new+'.png')
        assert len(new+'.png') <= 100, new
        assert hashlib.sha256(target.read_bytes()).hexdigest() == receipt[old], new
    for path in rp.rglob('*'):
        if path.is_file():
            assert len(path.relative_to(rp).as_posix()) <= 100, str(path)
    for path in rp.rglob('*.json'):
        value = json.loads(path.read_text(encoding='utf-8-sig'))
        assert rewrite_values(value) == value, str(path)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--write', action='store_true')
    args = parser.parse_args()
    if args.write:
        print(json.dumps(normalize(ROOT/'runtime/RP')))
    check(ROOT/'runtime/RP', json.loads((ROOT/'data/compact-texture-paths.json').read_text()))
    print('Compact texture paths verified: 12 textures; original image bytes retained')
