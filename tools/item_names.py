"""Generate native item display names without changing plain guide/menu names."""
import json
from pathlib import Path

TOOLTIP_PREFIX = 'senluo.tooltip.'
SOURCE_NAMES = {'en_US': 'Kaleidoscope World Liquor',
                'zh_CN': '森罗酒馆：世界名酒', 'zh_TW': '森羅酒館：世界名酒'}


def tooltip_key(name_key):
    return TOOLTIP_PREFIX + name_key


def tooltip_text(name, locale):
    return name + '\\n§9§o' + SOURCE_NAMES[locale] + '§r'


def generate(runtime):
    payload = json.loads((runtime / 'BP/scripts/payload.js').read_text().split('=', 1)[1].strip().rstrip(';'))
    # Tavern's quality-bottle formatter already supplies the source footer.
    # Leave that functional owner intact rather than displaying it twice.
    bottles = {item for row in payload['content'] if row['kind'] == 'bottle'
               for item in [*row['items'], *([row['genericItem']] if row.get('genericItem') else [])]}
    names = []
    for path in sorted((runtime / 'BP/items').glob('*.json')):
        definition = json.loads(path.read_text())
        item = definition['minecraft:item']
        if item['description']['identifier'] in bottles:
            continue
        display = item['components']['minecraft:display_name']
        key = display['value']
        plain = key.removeprefix(TOOLTIP_PREFIX)
        names.append(plain)
        display['value'] = tooltip_key(plain)
        path.write_text(json.dumps(definition, ensure_ascii=False, indent=2) + '\n')
    for path in sorted((runtime / 'BP/blocks').glob('*.json')):
        definition = json.loads(path.read_text())
        block = definition['minecraft:block']
        description = block['description']
        if description.get('menu_category', {}).get('category', 'none') == 'none':
            continue
        plain = 'tile.' + description['identifier'] + '.name'
        names.append(plain)
        block['components']['minecraft:display_name'] = tooltip_key(plain)
        path.write_text(json.dumps(definition, ensure_ascii=False, indent=2) + '\n')
    for locale in SOURCE_NAMES:
        path = runtime / 'RP/texts' / (locale + '.lang')
        lines = path.read_text().splitlines()
        plain_names = dict(line.split('=', 1) for line in lines if '=' in line and not line.startswith('#'))
        labels = {tooltip_key(key): tooltip_text(plain_names[key], locale) for key in names}
        # Replace only this producer's display entries. Original .name entries,
        # guide text, item metadata and language selection remain untouched.
        lines = [line for line in lines if line.partition('=')[0] not in labels]
        lines.extend(key + '=' + value for key, value in labels.items())
        path.write_text('\n'.join(lines) + '\n')


if __name__ == '__main__':
    generate(Path(__file__).resolve().parents[1] / 'runtime')
