"""Build isolated native-record capability fixtures; never release input.

Default output preserves the historical BDS 1.26.52.3 / server 2.11.0-beta
fixture. Use --target 1.26.60.6 to build a separate current-target fixture for
BDS 1.26.60.6 / server 2.12.0-beta. Both require Beta APIs (world gametest)
and Upcoming Creator Features in a fresh disposable world. The vanilla record
is a positive control; custom results are measurements, not a permanent
unsupported-API rule.
"""
from pathlib import Path
import argparse
import json
import shutil

ROOT = Path(__file__).resolve().parents[2]
BP = '43e4fe38-4232-42d5-854f-3072df7d85f0'
RP = 'bc80ac69-470e-4d2b-a29c-3fa48e8153bb'
EVENT = 'record.record_capability_probe'

TARGETS = {
    '1.26.52.3': {
        'min_engine': [1, 26, 50],
        'script_api': '2.11.0-beta',
        'vanilla_format': '1.26.50',
        'items': [('custom30', '1.26.30'), ('custom40', '1.26.40'), ('custom50', '1.26.50')],
        'probe': 'record-capability-probe.js',
    },
    '1.26.60.6': {
        'min_engine': [1, 26, 60],
        'script_api': '2.12.0-beta',
        'vanilla_format': '1.26.60',
        'items': [('custom30', '1.26.30'), ('custom40', '1.26.40'), ('custom50', '1.26.50'), ('custom60', '1.26.60')],
        'probe': 'record-capability-probe-260.js',
    },
}


def write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2) + '\n')


def build(output, target='1.26.52.3'):
    if target not in TARGETS:
        raise ValueError(f'Unsupported target: {target}')
    config = TARGETS[target]
    output.mkdir(parents=True, exist_ok=False)
    bp, rp = output / 'BP', output / 'RP'
    for folder, uuid, modules in [
        (bp, BP, [
            {'type': 'data', 'uuid': '548856c3-c3c6-4d80-a850-dcb8f65f9546'},
            {'type': 'script', 'uuid': 'f0cd243e-7576-492d-a006-e8e7b34c9310', 'language': 'javascript', 'entry': 'scripts/main.js'},
        ]),
        (rp, RP, [{'type': 'resources', 'uuid': '3492bf30-4949-4c7b-9606-88a462341a2e'}]),
    ]:
        for module in modules:
            module['version'] = [1, 0, 0]
        manifest = {
            'format_version': 2,
            'header': {
                'name': 'Record capability fixture ' + folder.name,
                'description': 'Disposable diagnostic; no players or Java parity acceptance',
                'uuid': uuid,
                'version': [1, 0, 0],
                'min_engine_version': config['min_engine'],
            },
            'modules': modules,
        }
        if folder == bp:
            manifest['dependencies'] = [
                {'uuid': RP, 'version': [1, 0, 0]},
                {'module_name': '@minecraft/server', 'version': config['script_api']},
            ]
        write(folder / 'manifest.json', manifest)

    records = [('vanilla', config['vanilla_format'], 'record.cat')]
    records.extend((suffix, fmt, EVENT) for suffix, fmt in config['items'])
    for suffix, fmt, event in records:
        write(bp / 'items' / (suffix + '.json'), {
            'format_version': fmt,
            'minecraft:item': {
                'description': {'identifier': 'record_qa:' + suffix},
                'components': {
                    'minecraft:max_stack_size': 1,
                    'minecraft:record': {'sound_event': event, 'duration': 2920, 'comparator_signal': 5},
                },
            },
        })

    (bp / 'scripts').mkdir()
    shutil.copy2(Path(__file__).with_name(config['probe']), bp / 'scripts/main.js')
    sounds = json.loads((ROOT / 'runtime/RP/sounds/sound_definitions.json').read_text())['sound_definitions']['kaleidoscope_world_liquor.music_disc.random_disc']
    write(rp / 'sounds/sound_definitions.json', {'format_version': '1.14.0', 'sound_definitions': {EVENT: sounds}})
    (rp / 'sounds/kwl').mkdir()
    for name in ('custom_music_1.ogg', 'custom_music_2.ogg'):
        shutil.copy2(ROOT / 'runtime/RP/sounds/kwl' / name, rp / 'sounds/kwl' / name)

    write(output / 'fixture.json', {
        'engine_tested': target,
        'experiments': {'gametest': True, 'upcoming_creator_features': True},
        'script_api': config['script_api'],
        'beta_apis_experiment': 'gametest',
        'client': False,
        'release_input': False,
        'probe_script': config['probe'],
    })
    return {'BP': BP, 'RP': RP, 'output': str(output), 'target': target}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--target', choices=tuple(TARGETS), default='1.26.52.3')
    args = parser.parse_args()
    print(json.dumps(build(args.output, args.target), indent=2))
