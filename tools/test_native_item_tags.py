#!/usr/bin/env python3
"""Source/native-data regressions, not an in-engine crafting simulation."""
import copy
import json
import shutil
import tempfile
import unittest
from pathlib import Path

from update_mixology_111 import merge_item_tags
from drink_content_contract import check_native_bottles

ROOT = Path(__file__).resolve().parents[1]
NS = 'kaleidoscope_world_liquor:'
ALCOHOL = 'kaleidoscope_tavern:alcohol'


def read(path):
    return json.loads(path.read_text(encoding='utf-8-sig'))


def exported(name):
    return json.loads((ROOT / 'runtime/BP/scripts' / name).read_text()
                      .split('=', 1)[1].strip().rstrip(';'))


class NativeItemTags(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.payload = exported('payload.js')
        cls.bottles = [row for row in cls.payload['content'] if row['kind'] == 'bottle']
        cls.tags = {}
        for path in (ROOT / 'runtime/BP/items').glob('*.json'):
            item = read(path)['minecraft:item']
            cls.tags[item['description']['identifier']] = item['components'].get('minecraft:tags', {}).get('tags', [])
        cls.source_bases = {item for item in read(ROOT / 'upstream/data/kaleidoscope_tavern/tags/item/alcohol.json')['values']
                            if isinstance(item, str) and item.startswith(NS)}

    def test_mixology_delta_preserves_unrelated_tags(self):
        before = [ALCOHOL, 'example:unrelated', 'example:old_color']
        change = {'remove': ['example:old_color'], 'add': ['example:new_color']}
        saved = copy.deepcopy((before, change))
        after = merge_item_tags(before, change)
        self.assertEqual(after, [ALCOHOL, 'example:unrelated', 'example:new_color'])
        self.assertEqual((before, change), saved)
        self.assertEqual(merge_item_tags(after, change), after)

    def test_mixology_delta_removal_addition_and_deduplication(self):
        self.assertEqual(merge_item_tags([], {'add': ['example:new', 'example:new']}), ['example:new'])
        self.assertEqual(merge_item_tags(['example:old'], {'remove': ['example:old']}), [])
        # The existing shared registry applies removal before addition.
        self.assertEqual(merge_item_tags(['example:both'], {'remove': ['example:both'], 'add': ['example:both']}), ['example:both'])

    def test_all_quality_variants_match_original_alcohol_membership(self):
        self.assertTrue(self.source_bases)
        self.assertLessEqual(self.source_bases, {row['base'] for row in self.bottles})
        for row in self.bottles:
            self.assertEqual(len(row['items']), 6, row['base'])
            for item in row['items']:
                with self.subTest(item=item):
                    self.assertEqual(ALCOHOL in self.tags[item], row['base'] in self.source_bases)

    def test_current_cocktail_tags_remain_available(self):
        for change in self.payload['itemTagChanges']:
            item = change['item']
            if not item.startswith(NS) or item not in self.tags:
                continue
            with self.subTest(item=item):
                self.assertLessEqual(set(change['add']), set(self.tags[item]))
                self.assertFalse((set(change['remove']) - set(change['add'])) & set(self.tags[item]))

    def test_current_owner_covers_complete_native_bottle_definitions(self):
        paths = check_native_bottles(self.payload['content'], ROOT)
        self.assertEqual(len(paths), sum(len(row['items']) for row in self.bottles))
        # A tag-only exemption would miss these independent component failures.
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            shutil.copytree(ROOT / 'upstream/data/kaleidoscope_tavern/tags/item', root / 'upstream/data/kaleidoscope_tavern/tags/item')
            for name in paths:
                (root / name).parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(ROOT / name, root / name)
            item_path = root / sorted(paths)[0]
            original = read(item_path)
            variants = []
            for component, value in [('minecraft:max_stack_size', 64), ('minecraft:icon', 'wrong_icon'),
                                     ('minecraft:display_name', {'value': 'wrong_name'}), ('minecraft:use_animation', 'eat'),
                                     ('minecraft:use_modifiers', {'use_duration': 0}), ('kaleidoscope_tavern:drink_effects', {'wrong': True})]:
                variant = copy.deepcopy(original)
                variant['minecraft:item']['components'][component] = value
                variants.append((component, variant))
            variant = copy.deepcopy(original)
            variant['minecraft:item']['description']['identifier'] = NS + 'wrong_quality_id'
            variants.append(('identifier', variant))
            variant = copy.deepcopy(original)
            variant['minecraft:item']['components']['minecraft:tags']['tags'].append('example:unexpected')
            variants.append(('unexpected tag', variant))
            for label, variant in variants:
                with self.subTest(mutation=label):
                    item_path.write_text(json.dumps(variant))
                    with self.assertRaises(AssertionError):
                        check_native_bottles(self.payload['content'], root)
                    item_path.write_text(json.dumps(original))

    def test_custom_record_source_recipe_and_native_tag_predicates(self):
        source = read(ROOT / 'upstream/data/kaleidoscope_world_liquor/recipe/custom_record.json')
        actual = read(ROOT / 'runtime/BP/recipes/custom_record.json')['minecraft:recipe_shapeless']
        self.assertEqual(source['ingredients'], [{'tag': ALCOHOL}] * 9)
        self.assertEqual(actual['ingredients'], source['ingredients'])
        self.assertEqual(actual['result'], {'item': source['result']['id'], 'count': source['result']['count']})
        eligible = [item for row in self.bottles if row['base'] in self.source_bases for item in row['items']]
        ineligible = [item for row in self.bottles if row['base'] not in self.source_bases for item in row['items']]
        # Evaluate the actual nine native tag predicates, including mixed quality/base IDs.
        grids = [[item] * 9 for item in eligible] + [eligible[:9], eligible[-9:]]
        for grid in grids:
            self.assertTrue(all(ingredient['tag'] in self.tags[item] for item, ingredient in zip(grid, actual['ingredients'], strict=True)))
        for item in ineligible:
            grid = [*eligible[:8], item]
            self.assertFalse(all(ingredient['tag'] in self.tags[value] for value, ingredient in zip(grid, actual['ingredients'], strict=True)))


if __name__ == '__main__':
    unittest.main()
