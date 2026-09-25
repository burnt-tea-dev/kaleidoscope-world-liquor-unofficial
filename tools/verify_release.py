#!/usr/bin/env python3
"""Verify release metadata and every archive entry against canonical runtime."""
import argparse
import hashlib
import json
import os
import re
import subprocess
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--export-env', action='store_true')
    args = parser.parse_args()
    request = json.loads((ROOT / '.github/release-request.json').read_text())
    version = request['version']
    assert re.fullmatch(r'\d+\.\d+\.\d+', version)
    assert request['tag'] == f'v{version}-preview.1'
    assert request['prerelease'] is True
    assert request['title'] and '\n' not in request['title'] and '\r' not in request['title']
    assert re.fullmatch(r'[0-9a-f]{64}', request['expected_archive_sha256'])
    assert re.fullmatch(r'[0-9a-f]{40}', request['tavern_commit'])
    dependency = ROOT.parent / 'tavern-src'
    actual_commit = subprocess.check_output(['git', '-C', str(dependency), 'rev-parse', 'HEAD'], text=True).strip()
    assert actual_commit == request['tavern_commit'], 'Wrong pinned Tavern source'
    versions = [int(v) for v in version.split('.')]
    for pack in ('BP', 'RP'):
        manifest = json.loads((ROOT / 'runtime' / pack / 'manifest.json').read_text())
        assert manifest['header']['version'] == versions
        assert all(module['version'] == versions for module in manifest['modules'])
        tavern = json.loads((dependency / 'runtime' / pack / 'manifest.json').read_text())['header']
        assert any(d.get('uuid') == tavern['uuid'] and d.get('version') == tavern['version'] for d in manifest['dependencies'])
    payload_text = (ROOT / 'runtime/BP/scripts/payload.js').read_text()
    payload = json.loads(payload_text.split('=', 1)[1].strip().rstrip(';'))
    assert payload['version'] == version, 'Guide protocol version is stale'
    filename = f'Kaleidoscope_World_Liquor_Unofficial_{version}_preview1.mcaddon'
    archive_path = ROOT / 'dist' / filename
    digest = hashlib.sha256(archive_path.read_bytes()).hexdigest()
    assert digest == request['expected_archive_sha256'], (digest, request['expected_archive_sha256'])
    runtime = ROOT / 'runtime'
    expected = {p.relative_to(runtime).as_posix(): p for p in runtime.rglob('*') if p.is_file()}
    assert all(not p.is_symlink() for p in expected.values())
    with zipfile.ZipFile(archive_path) as archive:
        names = archive.namelist()
        assert len(names) == len(set(names)), 'Duplicate ZIP entries'
        assert set(names) == set(expected), 'ZIP is not the complete canonical runtime'
        for name, path in expected.items():
            assert archive.read(name) == path.read_bytes(), name
    evidence = {'version': version, 'archive': filename, 'sha256': digest, 'bytes': archive_path.stat().st_size,
                'entries': len(expected), 'tavernCommit': actual_commit, 'fullRuntimeMatch': True,
                'newBdsTest': False, 'clientTest': False, 'playerSimulation': False}
    (ROOT / 'dist/ARCHIVE-VERIFICATION.json').write_text(json.dumps(evidence, indent=2) + '\n')
    print(json.dumps(evidence))
    if args.export_env:
        with open(os.environ['GITHUB_ENV'], 'a') as output:
            output.write(f"TAG={request['tag']}\nTITLE={request['title']}\n")

if __name__ == '__main__':
    main()
