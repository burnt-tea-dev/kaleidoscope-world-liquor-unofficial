"""Build a small, separate native-record capability fixture; never release input.

Import the generated BP/RP into a fresh disposable 1.26.52.3 world. Enable Beta
APIs (world gametest) and Upcoming Creator Features, retain ContentLog output,
and read RECORD_CAPABILITY_DONE. The vanilla record.cat item is the positive
control. Custom results are measurements, not a permanent unsupported-API rule.
"""
from pathlib import Path
import argparse
import json
import shutil

ROOT = Path(__file__).resolve().parents[2]
BP = '43e4fe38-4232-42d5-854f-3072df7d85f0'
RP = 'bc80ac69-470e-4d2b-a29c-3fa48e8153bb'
EVENT = 'record.record_capability_probe'


def write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2) + '\n')


def build(output):
    output.mkdir(parents=True, exist_ok=False)
    bp, rp = output / 'BP', output / 'RP'
    for folder, uuid, modules in [(bp, BP, [{'type': 'data', 'uuid': '548856c3-c3c6-4d80-a850-dcb8f65f9546'}, {'type': 'script', 'uuid': 'f0cd243e-7576-492d-a006-e8e7b34c9310', 'language': 'javascript', 'entry': 'scripts/main.js'}]), (rp, RP, [{'type': 'resources', 'uuid': '3492bf30-4949-4c7b-9606-88a462341a2e'}])]:
        for module in modules:
            module['version'] = [1, 0, 0]
        manifest = {'format_version': 2, 'header': {'name': 'Record capability fixture ' + folder.name, 'description': 'Disposable diagnostic; no players or Java parity acceptance', 'uuid': uuid, 'version': [1, 0, 0], 'min_engine_version': [1, 26, 50]}, 'modules': modules}
        if folder == bp:
            manifest['dependencies'] = [{'uuid': RP, 'version': [1, 0, 0]}, {'module_name': '@minecraft/server', 'version': '2.11.0-beta'}]
        write(folder / 'manifest.json', manifest)
    for suffix, fmt, event in [('vanilla', '1.26.50', 'record.cat'), ('custom30', '1.26.30', EVENT), ('custom40', '1.26.40', EVENT), ('custom50', '1.26.50', EVENT)]:
        write(bp / 'items' / (suffix + '.json'), {'format_version': fmt, 'minecraft:item': {'description': {'identifier': 'record_qa:' + suffix}, 'components': {'minecraft:max_stack_size': 1, 'minecraft:record': {'sound_event': event, 'duration': 2920, 'comparator_signal': 5}}}})
    (bp / 'scripts').mkdir()
    shutil.copy2(Path(__file__).with_name('record-capability-probe.js'), bp / 'scripts/main.js')
    sounds = json.loads((ROOT / 'runtime/RP/sounds/sound_definitions.json').read_text())['sound_definitions']['kaleidoscope_world_liquor.music_disc.random_disc']
    write(rp / 'sounds/sound_definitions.json', {'format_version': '1.14.0', 'sound_definitions': {EVENT: sounds}})
    (rp / 'sounds/kwl').mkdir()
    for name in ('custom_music_1.ogg', 'custom_music_2.ogg'):
        shutil.copy2(ROOT / 'runtime/RP/sounds/kwl' / name, rp / 'sounds/kwl' / name)
    write(output / 'fixture.json', {'engine_tested': '1.26.52.3', 'experiments': {'gametest': True, 'upcoming_creator_features': True}, 'script_api': '2.11.0-beta', 'client': False, 'release_input': False})
    return {'BP': BP, 'RP': RP, 'output': str(output)}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    print(json.dumps(build(parser.parse_args().output), indent=2))
