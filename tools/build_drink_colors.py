#!/usr/bin/env python3
"""Explicit source authoring/check step; never rewrite runtime during packaging."""
from pathlib import Path
import argparse,json,re
ROOT=Path(__file__).resolve().parents[1]
def expected(payload):
    tags={}
    for path in sorted((ROOT/'data/java-parity/neoforge-1.1.9/cocktail-tags').glob('*.json')):
        tag='kaleidoscope_tavern:'+path.stem
        for original in json.loads(path.read_text())['values']:
            item=original.replace('smc:','kaleidoscope_world_liquor:')
            tags.setdefault(item,[]).append(tag)
    for row in payload['shakerInputs']:
        base=re.sub(r'_q[1-6]$','',row['item'])
        assert base in tags, 'Missing Java tag for '+base
        row['ingredientTags']=tags[base]
    for row in payload['content']:
        if row['kind']!='bottle':continue
        source=tags[row['base']]
        assert len(source)==1, 'Multiple colors require Java ColorUtils precedence review'
        row['color']=source[0].split('cocktail_ingredient_',1)[1]
    payload['requires']=sorted(set(payload.get('requires',[])+['shaker_ingredient_tags']))
    return payload
def main():
    p=argparse.ArgumentParser();p.add_argument('--check',action='store_true');args=p.parse_args()
    path=ROOT/'runtime/BP/scripts/payload.js'
    before=json.loads(path.read_text().split('=',1)[1].strip().rstrip(';'))
    after=expected(json.loads(json.dumps(before)))
    if args.check:assert before==after,'Stale Java drink-color/tag declarations'
    else:path.write_text('export const payload = '+json.dumps(after,ensure_ascii=False,indent=2)+';\n')
    print('Java drink colors and tag memberships verified')
if __name__=='__main__':main()
