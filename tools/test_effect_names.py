import unittest
from build_effect_names import render_names, MARKER

class EffectNameSectionTests(unittest.TestCase):
    def test_preserves_following_source_label_and_unrelated_section(self):
        rows = {'effect.kaleidoscope_world_liquor.beheading': 'Beheading'}
        tail = '\n## Addon source label\nitem.kaleidoscope_world_liquor.mod_name=World Liquor\n'
        old = 'prefix=value\n\n' + MARKER + '\n' + next(iter(rows)) + '=Old\n' + tail
        got = render_names(old, rows)
        self.assertTrue(got.endswith(tail))
        self.assertEqual(got.count('=Beheading'), 1)
        self.assertNotIn('=Old', got)
        self.assertEqual(render_names(got, rows), got)
    def test_adds_missing_section(self):
        got = render_names('prefix=value\n', {'effect.example': 'Name'})
        self.assertEqual(got, 'prefix=value\n\n'+MARKER+'\neffect.example=Name\n')
    def test_rejects_duplicate_before_marker(self):
        with self.assertRaises(ValueError):
            render_names('effect.example=Old\n', {'effect.example': 'Name'})

if __name__ == '__main__': unittest.main()
