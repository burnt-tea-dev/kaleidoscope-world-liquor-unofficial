"""Refresh selected drink tables without rebuilding unrelated runtime repairs."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'upstream/data/kaleidoscope_world_liquor/datamap/drink_effect/maotai.json'


def main():
    source = json.loads(SOURCE.read_text())
    for name, export in [('content.js', 'CONTENT'), ('payload.js', 'payload')]:
        path = ROOT / 'runtime/BP/scripts' / name
        data = json.loads(path.read_text().split('=', 1)[1].strip().rstrip(';'))
        content = data if name == 'content.js' else data['content']
        next(row for row in content if row.get('base') == source['item'])['effects'] = source['effects']
        if name == 'payload.js':
            for row in data['shakerInputs']:
                if row['item'].startswith(source['item'] + '_q'):
                    row['effects'] = source['effects'][int(row['item'][-1]) - 1]
        path.write_text('export const ' + export + ' = ' + json.dumps(data, ensure_ascii=False, indent=2) + ';\n')


if __name__ == '__main__':
    main()
