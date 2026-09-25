#!/usr/bin/env python3
"""Build only the effect-name section consumed by Tavern's shared actionbar."""
import argparse
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MARKER = '## Shared Tavern effect bar names'
PREFIX = 'effect.kaleidoscope_world_liquor.'
# Java has no zh_tw file here; these are translations of its zh_cn names.
TRADITIONAL = {
    'beheading': '斬首', 'boating_master': '船長的祝福',
    'captain_gift': '水上行走', 'continuous_heal': '瞬間恢復',
    'double_damage': '重斬', 'elbow_strike': '肘擊',
    'frost_walker': '冰霜行者', 'ground_crit': '破勢',
    'hostile_detection': '冥視', 'multi_jump': '多段跳',
    'reverse_gravity': '反重力', 'tequila': '龍舌蘭',
    'treasure_guide': '淘金熱', 'treasure_sense': '寶藏感知',
}

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    for locale in ('en_US', 'zh_CN', 'zh_TW'):
        source = 'en_us' if locale == 'en_US' else 'zh_cn'
        path = ROOT / 'upstream/assets/kaleidoscope_world_liquor/lang' / (source + '.json')
        java = json.loads(path.read_text(encoding='utf-8'))
        fallback = {'elbow_strike': 'Elbow Strike' if locale == 'en_US' else '肘击'}
        rows = {}
        for name in sorted(TRADITIONAL):
            key = PREFIX + name
            value = TRADITIONAL[name] if locale == 'zh_TW' else java.get(key, fallback.get(name))
            if not value or any(ch in value for ch in '\n\r'):
                raise ValueError(f'Missing or invalid effect name: {locale} {key}')
            rows[key] = value
        target = ROOT / 'runtime/RP/texts' / (locale + '.lang')
        old = target.read_text(encoding='utf-8')
        base = old.split(MARKER, 1)[0].rstrip() + '\n'
        for key in rows:
            if any(line.startswith(key + '=') for line in base.splitlines()):
                raise ValueError(f'Duplicate name outside generated section: {locale} {key}')
        result = base + '\n' + MARKER + '\n' + ''.join(f'{key}={value}\n' for key, value in rows.items())
        if args.check:
            if old != result:
                raise SystemExit(f'Effect names are stale: {target}')
        else:
            target.write_text(result, encoding='utf-8', newline='\n')
        print(f'{locale}: {len(rows)} names; sha256={hashlib.sha256(result.encode()).hexdigest()}')

if __name__ == '__main__':
    main()
