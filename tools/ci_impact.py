#!/usr/bin/env python3
"""Conservative CI impact gate: only reviewed prose paths may skip runtime jobs."""
import argparse
import json
import os
import posixpath
from pathlib import Path
import re
import subprocess

# Reviewed non-package inputs. README baseline identity is checked unconditionally.
# Do not widen this to docs/**: release notes, evidence, status and admission data
# can be functional inputs. Re-audit this list when adding consumers of these files.
PROSE = frozenset({'AGENTS.md', 'README.md', 'README.zh-TW.md', 'docs/BUGS.md'})


def plan(paths, force_full_reason=None, release_inputs=()):
    paths = sorted(set(paths))
    runtime = bool(force_full_reason or not paths or
                   any(p not in PROSE or p in release_inputs for p in paths))
    return {'schema': 1, 'runtime': runtime, 'paths': paths,
            'reason': force_full_reason or (
                'Empty diff requires complete validation' if not paths else
                'Functional or unknown input changed' if runtime else
                'Only explicitly reviewed prose changed; baseline checks still run')}


def release_inputs(repo):
    """A prose file selected as release notes/evidence is no longer prose-only."""
    request = json.loads((repo / '.github/release-request.json').read_text())
    if not isinstance(request, dict):
        raise ValueError('Invalid release request')
    # Include every string rather than assuming only today's known field names.
    def strings(value):
        if isinstance(value, str):
            # Release consumers normalize ./ and repeated separators with Path.
            # Normalize dot segments too, conservatively covering equivalent paths.
            yield posixpath.normpath(value)
        elif isinstance(value, dict):
            for item in value.values():
                yield from strings(item)
        elif isinstance(value, list):
            for item in value:
                yield from strings(item)
    return set(strings(request))


def changed_paths(event_name, event, repo):
    if event_name == 'workflow_dispatch':
        return [], 'Manual runs always execute complete validation'
    try:
        if event_name == 'pull_request':
            base = event['pull_request']['base']['sha']
            head = event['pull_request']['head']['sha']
            separator = '...'
        elif event_name == 'push':
            base, head = event['before'], event['after']
            separator = '..'
        else:
            return [], 'Unknown event requires complete validation'
        if not all(isinstance(sha, str) and re.fullmatch(r'[0-9a-fA-F]{40}', sha)
                   and set(sha) != {'0'} for sha in (base, head)):
            return [], 'Missing or invalid comparison revision requires complete validation'
        # Complete Git history, not the event's truncated commit/file lists.
        # Disable rename detection so both old and new paths participate.
        result = subprocess.run(
            ['git', 'diff', '--no-renames', '--name-only', '-z',
             f'{base}{separator}{head}', '--'], cwd=repo, check=True,
            stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        return [p for p in result.stdout.decode('utf-8').split('\0') if p], None
    except (KeyError, TypeError, OSError, UnicodeError, subprocess.CalledProcessError):
        return [], 'Unavailable comparison history requires complete validation'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repo', type=Path, default=Path(__file__).resolve().parents[1])
    args = parser.parse_args()
    try:
        event = json.loads(Path(os.environ['GITHUB_EVENT_PATH']).read_text())
        paths, reason = changed_paths(os.environ.get('GITHUB_EVENT_NAME'), event, args.repo)
        inputs = release_inputs(args.repo)
    except (KeyError, OSError, ValueError, TypeError):
        paths, inputs, reason = [], (), 'Unavailable event or release metadata requires complete validation'
    result = plan(paths, reason, inputs)
    print(json.dumps(result, indent=2))
    if output := os.environ.get('GITHUB_OUTPUT'):
        with open(output, 'a') as stream:
            stream.write('runtime=' + str(result['runtime']).lower() + '\n')
    if summary := os.environ.get('GITHUB_STEP_SUMMARY'):
        with open(summary, 'a') as stream:
            stream.write('CI impact: ' + result['reason'] + '.\n\n')
            stream.write('Baseline, release-claim and workflow contracts always run. ')
            stream.write('Runtime jobs run.\n' if result['runtime'] else
                         'bridge, package and wall-record explicitly skip this prose-only diff.\n')


if __name__ == '__main__':
    main()
