"""Fail-closed impact planning and real Git comparison regressions."""
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

from ci_impact import changed_paths, plan, release_inputs


class Planning(unittest.TestCase):
    def test_reviewed_prose(self):
        self.assertFalse(plan(['README.md', 'README.zh-TW.md', 'docs/BUGS.md'])['runtime'])

    def test_empty_unknown_and_mixed_changes(self):
        self.assertTrue(plan([])['runtime'])
        for path in ['runtime/BP/scripts/main.js', 'tests/check.md', 'package.json',
                     'package-lock.json', 'requirements.txt', 'baseline.json',
                     '.github/baseline-integration.json', '.github/workflows/validation.yml',
                     '.github/release-request.json', 'tools/ci_impact.py', 'new-config.toml',
                     'docs/BASELINE-STATUS.md', 'docs/RELEASE-NOTES-0.1.144.md',
                     'docs/BDS-FAMILY-20261001.json', 'docs/item-inventory.json',
                     '../README.md', '/README.md', 'docs/../README.md', '']:
            with self.subTest(path=path):
                self.assertTrue(plan(['README.md', path])['runtime'])

    def test_forced_full_and_release_input(self):
        self.assertTrue(plan(['README.md'], 'diff failed')['runtime'])
        self.assertTrue(plan(['README.md'], release_inputs={'README.md'})['runtime'])
        self.assertTrue(plan(['docs/BUGS.md'], release_inputs={'docs/BUGS.md'})['runtime'])

    def test_release_metadata_read(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / '.github').mkdir()
            p = root / '.github/release-request.json'
            p.write_text(json.dumps({'public_notes_path': 'README.md', 'nested': ['docs/BUGS.md']}))
            self.assertEqual(release_inputs(root), {'README.md', 'docs/BUGS.md'})
            p.write_text('[]')
            with self.assertRaises(ValueError): release_inputs(root)

    def test_dispatch_unknown_missing_and_zero_revision(self):
        for name, event in [('workflow_dispatch', {}), ('schedule', {}), ('push', {}),
                            ('push', {'before': '0' * 40, 'after': '1' * 40}),
                            ('push', {'before': '--option', 'after': '1' * 40}),
                            ('pull_request', {})]:
            paths, reason = changed_paths(name, event, Path('.'))
            self.assertTrue(plan(paths, reason)['runtime'])

    def test_failed_diff_and_non_utf8(self):
        event = {'before': '1' * 40, 'after': '2' * 40}
        with patch('ci_impact.subprocess.run', side_effect=subprocess.CalledProcessError(128, 'git')):
            paths, reason = changed_paths('push', event, Path('.'))
            self.assertTrue(plan(paths, reason)['runtime'])
        with patch('ci_impact.subprocess.run', return_value=subprocess.CompletedProcess([], 0, b'\xff\0')):
            paths, reason = changed_paths('push', event, Path('.'))
            self.assertTrue(plan(paths, reason)['runtime'])


class GitDiff(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.repo = Path(self.tmp.name)
        self.git('init', '-b', 'main')
        self.git('config', 'user.name', 'Impact tests')
        self.git('config', 'user.email', 'impact@example.invalid')
        self.write('README.md', 'initial prose\n')
        self.write('runtime/source.js', 'runtime source\n')
        self.base = self.commit()

    def git(self, *args):
        return subprocess.check_output(['git', *args], cwd=self.repo, stderr=subprocess.PIPE).decode().strip()

    def write(self, path, content):
        target = self.repo / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(content)

    def commit(self):
        self.git('add', '.')
        self.git('commit', '-m', 'fixture')
        return self.git('rev-parse', 'HEAD')

    def compare(self, base, head, pr=False):
        event = ({'pull_request': {'base': {'sha': base}, 'head': {'sha': head}}} if pr
                 else {'before': base, 'after': head})
        return changed_paths('pull_request' if pr else 'push', event, self.repo)

    def test_docs_only_and_empty_diff(self):
        self.write('README.md', 'updated prose\n')
        head = self.commit()
        paths, reason = self.compare(self.base, head)
        self.assertEqual(paths, ['README.md'])
        self.assertFalse(plan(paths, reason)['runtime'])
        paths, reason = self.compare(head, head)
        self.assertTrue(plan(paths, reason)['runtime'])

    def test_runtime_rename_into_allowed_prose_keeps_both_paths(self):
        self.git('mv', 'runtime/source.js', 'README.zh-TW.md')
        paths, reason = self.compare(self.base, self.commit())
        self.assertEqual(set(paths), {'runtime/source.js', 'README.zh-TW.md'})
        self.assertTrue(plan(paths, reason)['runtime'])

    def test_allowed_prose_rename_to_unknown_requires_full(self):
        self.git('mv', 'README.md', 'new.md')
        paths, reason = self.compare(self.base, self.commit())
        self.assertTrue(plan(paths, reason)['runtime'])

    def test_pr_uses_merge_base_and_complete_multi_commit_diff(self):
        self.git('checkout', '-b', 'feature')
        self.write('runtime/source.js', 'changed runtime\n')
        self.commit()
        self.write('README.md', 'last commit only prose\n')
        head = self.commit()
        self.git('checkout', 'main')
        self.write('unrelated-main.txt', 'main advanced\n')
        base = self.commit()
        paths, reason = self.compare(base, head, pr=True)
        self.assertEqual(set(paths), {'README.md', 'runtime/source.js'})
        self.assertTrue(plan(paths, reason)['runtime'])

    def test_diff_is_not_truncated_at_api_file_limit(self):
        for i in range(310): self.write(f'docs/{i}.md', 'new\n')
        self.write('runtime/z-last.js', 'changed\n')
        paths, reason = self.compare(self.base, self.commit())
        self.assertEqual(len(paths), 311)
        self.assertIn('runtime/z-last.js', paths)
        self.assertTrue(plan(paths, reason)['runtime'])

    def test_missing_history_requires_full(self):
        paths, reason = self.compare('1' * 40, self.base, pr=True)
        self.assertTrue(plan(paths, reason)['runtime'])


if __name__ == '__main__': unittest.main()
