"""Import the current author's lamp recipes, labels and shared guide data."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
NS = 'kaleidoscope_world_liquor'
COLORS = ('blue', 'green', 'pink')


def main():
    payload_path = ROOT / 'runtime/BP/scripts/payload.js'
    payload = json.loads(payload_path.read_text().split('=', 1)[1].strip().rstrip(';'))
    payload['furniture'] = [{'block': NS + ':' + color + '_pendant_lamp', 'kind': 'pendant_lamp'}
                            for color in COLORS if color != 'blue']
    for color in COLORS:
        short = color + '_pendant_lamp'
        source = json.loads((ROOT / 'upstream/data' / NS / 'recipe' / (short + '.json')).read_text())
        recipe = {'format_version': '1.20.10', 'minecraft:recipe_shaped': {
            'description': {'identifier': NS + ':' + short}, 'tags': ['crafting_table'],
            'pattern': source['pattern'], 'key': source['key'],
            'result': {'item': source['result']['id'], 'count': source['result']['count']},
            'unlock': [source['key']['G']]}}
        # Blue is a Tavern-owned product and recipe; its canonical owner ships it.
        if color == 'blue':
            continue
        (ROOT / 'runtime/BP/recipes' / (short + '.json')).write_text(json.dumps(recipe, indent=2) + '\n')
        page_id = NS + ':guide/' + short
        if not any(page['id'] == page_id for page in payload['pages']):
            payload['pages'].append({'id': page_id, 'item': source['result']['id'], 'category': 'lighting',
                                     'title': {}, 'body': {}, 'recipeIds': [],
                                     'icon': ('textures/kaleidoscope_tavern_jar/item/' if color == 'blue'
                                              else 'textures/kwl/items/') + short})
    payload_path.write_text('export const payload = ' + json.dumps(payload, ensure_ascii=False, indent=2) + ';\n')
    for locale in ('en_US', 'zh_CN', 'zh_TW'):
        source = json.loads((ROOT / 'upstream/assets' / NS / 'lang' /
                             ('en_us.json' if locale == 'en_US' else 'zh_cn.json')).read_text())
        path = ROOT / 'runtime/RP/texts' / (locale + '.lang')
        additions = {}
        for color in ('green', 'pink'):
            short = color + '_pendant_lamp'
            label = source['block.' + NS + '.' + short]
            if locale == 'zh_TW':
                label = {'green': '綠色垂燈', 'pink': '粉色垂燈'}[color]
            additions['item.' + NS + ':' + short + '.name'] = label
            additions['tile.' + NS + ':' + short + '.name'] = label
        lines = [line for line in path.read_text().splitlines() if line.split('=', 1)[0] not in additions]
        path.write_text('\n'.join(lines) + '\n' + ''.join(key + '=' + value + '\n' for key, value in additions.items()))
    icon = ROOT / 'runtime/RP/textures' / NS / 'mob_effect/luck.png'
    icon.write_bytes((ROOT / 'upstream/assets' / NS / 'textures/mob_effect/luck.png').read_bytes())


if __name__ == '__main__':
    main()
