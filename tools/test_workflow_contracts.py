"""Keep CI coverage and publication boundaries intact when consolidating jobs."""
import copy
from pathlib import Path
import unittest
import yaml

ROOT = Path(__file__).resolve().parents[1]
WORKFLOWS = ROOT / '.github/workflows'


def read_workflow(path):
    # BaseLoader retains GitHub's `on` key; YAML 1.1 SafeLoader treats it as bool.
    return yaml.load(path.read_text(), Loader=yaml.BaseLoader)


def commands(job):
    return '\n'.join(step.get('run', '') for step in job['steps'])


def validate_ci(workflow):
    assert set(workflow['on']) == {'push', 'pull_request', 'workflow_dispatch'}
    assert workflow['on']['push']['branches'] == ['main']
    assert workflow['permissions'] == {'contents': 'read'}
    assert workflow['concurrency']['cancel-in-progress'] == 'true'
    assert 'github.event.pull_request.number || github.ref' in workflow['concurrency']['group']
    jobs = workflow['jobs']
    # Existing required check contexts stay stable across workflow consolidation.
    assert set(jobs) == {'baseline', 'bridge', 'package', 'wall-record'}
    baseline, bridge, package, wall = [commands(jobs[key]) for key in ['baseline', 'bridge', 'package', 'wall-record']]
    assert '--history-base' in baseline
    assert 'python tools/baseline_gate.py check --release' in baseline
    for script in ['test_baseline_gate.py', 'test_bridge_project.py', 'test_workflow_contracts.py']:
        assert sum(commands(job).count(script) for job in jobs.values()) == 1, script
    assert jobs['bridge']['runs-on'] == 'windows-latest'
    for marker in ['core.autocrlf false', 'deno-dash-compiler/releases/download/v1.2.0/dash.exe',
                   '00bb6d984f0ffb819e2fb26c1eda5768db2d6e07a979712e34e1c76c2b7594de',
                   'Get-FileHash', 'dash.exe" build', '--verify-export builds/dist',
                   'baseline_gate.py check --release', 'git diff --exit-code']:
        assert marker in bridge, marker
    for script in ['test_effect_names.py', 'build_effect_names.py --check', 'build_storage_visuals.py',
                   'rebuild_guide.py', 'check_release.py', 'build_release.py', 'verify_release.py --development',
                   'tests/freezer-callback.test.mjs', 'tests/record-audio.test.mjs',
                   'tests/multi-jump.test.mjs', 'tests/freezer-state.test.mjs',
                   'tests/elbow-source.test.mjs', 'tests/elbow-native-evidence.test.mjs',
                   'tools/test_pick_block.py', 'tools/effect-bar.test.mjs', 'tools/creative/test_catalog.py']:
        assert script in package, script
    assert 'steps.pin.outputs.commit' in str(jobs['package']['steps'])
    assert 'tests/test_wall_record_generation.py' in wall
    assert sum(commands(job).count('tests/wall-record.test.mjs') for job in jobs.values()) == 1
    assert 'tests/wall-record.test.mjs' in wall
    assert '--experimental-loader ./tests/wall-record-loader.mjs' in wall


class WorkflowContracts(unittest.TestCase):
    def setUp(self):
        self.workflow = read_workflow(WORKFLOWS / 'validation.yml')

    def test_complete_ci_contract(self):
        validate_ci(self.workflow)

    def test_retired_workflows_cannot_reintroduce_duplicate_suites(self):
        self.assertEqual({p.name for p in WORKFLOWS.glob('*.yml')}, {'validation.yml', 'publish-release.yml'})

    def test_missing_unique_wall_geometry_coverage_is_rejected(self):
        workflow = copy.deepcopy(self.workflow)
        job = workflow['jobs']['wall-record']
        job['steps'] = [step for step in job['steps'] if 'test_wall_record_generation.py' not in step.get('run', '')]
        with self.assertRaises(AssertionError): validate_ci(workflow)

    def test_duplicate_wall_callback_coverage_is_rejected(self):
        workflow = copy.deepcopy(self.workflow)
        workflow['jobs']['package']['steps'].append({'run': 'node --test tests/wall-record.test.mjs'})
        with self.assertRaises(AssertionError): validate_ci(workflow)

    def test_missing_freezer_callback_coverage_is_rejected(self):
        workflow = copy.deepcopy(self.workflow)
        for step in workflow['jobs']['package']['steps']:
            if 'run' in step: step['run'] = step['run'].replace('tests/freezer-callback.test.mjs', '')
        with self.assertRaises(AssertionError): validate_ci(workflow)

    def test_missing_windows_export_boundary_is_rejected(self):
        workflow = copy.deepcopy(self.workflow)
        for step in workflow['jobs']['bridge']['steps']:
            if 'run' in step: step['run'] = step['run'].replace('--verify-export builds/dist', '')
        with self.assertRaises(AssertionError): validate_ci(workflow)

    def test_publication_stays_explicit_and_preserves_uploaded_byte_readback(self):
        workflow = read_workflow(WORKFLOWS / 'publish-release.yml')
        self.assertEqual(workflow['on']['push']['paths'], ['.github/release-request.json'])
        self.assertEqual(workflow['concurrency']['cancel-in-progress'], 'false')
        publish = commands(workflow['jobs']['publish'])
        for marker in ['python tools/verify_release.py --export-env', 'gh release download',
                       "assert local==remote", 'Refusing to modify a published release',
                       'gh release edit', 'asset-readback.json']:
            self.assertIn(marker, publish)
        self.assertLess(publish.index('assert local==remote'), publish.index('gh release edit'))


if __name__ == '__main__': unittest.main()
