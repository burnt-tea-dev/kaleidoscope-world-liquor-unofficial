#!/usr/bin/env python3
"""Rebuild product guide only, from canonical runtime recipes and localizations.
Does not regenerate models, change recipes, or simulate Minecraft interactions.
"""
from pathlib import Path
import collections, json, re, os, sys
from guide_copy import guide_body
ROOT=Path(__file__).resolve().parents[1]
TAV=Path(os.environ.get('TAVERN_ROOT',str(ROOT.parent/'tavern-src')))
NS='kaleidoscope_world_liquor'; KT='kaleidoscope_tavern'
LOCALES=('en_US','zh_CN','zh_TW')
def loadjs(path):
 return json.loads(path.read_text(encoding='utf-8').split('=',1)[1].strip().rstrip(';'))
def writejs(path,name,value):
 path.write_text('export const '+name+' = '+json.dumps(value,ensure_ascii=False,indent=2)+';\n',encoding='utf-8',newline='\n')
def triple(en,cn,tw):return dict(zip(LOCALES,(en,cn,tw)))
source=(TAV/'runtime/BP/scripts/data/cookery-guide-payload.js').read_text(encoding='utf-8')
names=json.loads(re.search(r'const GUIDE_ITEM_NAMES=(.*);',source).group(1))
for pack in (TAV,ROOT):
 for lc in LOCALES:
  for row in (pack/f'runtime/RP/texts/{lc}.lang').read_text(encoding='utf-8').splitlines():
   if '=' not in row:continue
   key,value=row.split('=',1)
   if key.startswith('item.') and key.endswith('.name'):
    item=key[5:-5];names[lc][item]=value;names[lc].setdefault(re.sub(r'_q[1-6]$','',item),value)
terms={
 'minecraft:wheat_seeds':('Wheat Seeds','小麦种子','小麥種子'),
 'minecraft:crimson_roots':('Crimson Roots','绯红菌索','緋紅蕈根'),
 'minecraft:bamboo':('Bamboo','竹子','竹子'),
 'minecraft:bread':('Bread','面包','麵包'),
 'minecraft:vine':('Vines','藤蔓','藤蔓'),
 'minecraft:chain':('Chain','锁链','鎖鏈'),
 'minecraft:iron_ingot':('Iron Ingot','铁锭','鐵錠'),
 'minecraft:iron_trapdoor':('Iron Trapdoor','铁活板门','鐵製地板門'),
 'minecraft:gold_nugget':('Gold Nugget','金粒','金粒'),
 'minecraft:cookie':('Cookie','曲奇','餅乾'),
 'minecraft:frame':('Item Frame','物品展示框','物品展示框'),
 'minecraft:rabbit':('Raw Rabbit','生兔肉','生兔肉'),
 'minecraft:ink_sac':('Ink Sac','墨囊','墨囊'),
 'minecraft:potion':('Potion item (any potion; water recommended)','药水物品（任意药水；建议用水瓶）','藥水物品（任意藥水；建議用水瓶）'),
 'minecraft:ice':('Ice','冰','冰'),
 'minecraft:packed_ice':('Packed Ice','浮冰','冰磚'),
 'minecraft:magma':('Magma Block','岩浆块','岩漿塊'),
 'minecraft:obsidian':('Obsidian','黑曜石','黑曜石'),
 'minecraft:snowball':('Snowball','雪球','雪球'),
 'minecraft:slime_ball':('Slimeball','黏液球','史萊姆球'),
 'minecraft:blue_dye':('Blue Dye','蓝色染料','藍色染料'),
 'minecraft:bowl':('Bowl','碗','碗'),
 'kaleidoscope_cookery:rice_panicle':('Rice Panicle','稻穗','稻穗'),
 NS+':milk_still':('Milk','牛奶','牛奶'),
 '#kaleidoscope_tavern:alcohol':('Any item with the Tavern alcohol tag','带酒馆 alcohol 标签的任意酒品','帶酒館 alcohol 標籤的任意酒品')}
colors={'white':('White','白色','白色'),'orange':('Orange','橙色','橙色'),'magenta':('Magenta','品红色','洋紅色'),'light_blue':('Light Blue','淡蓝色','淺藍色'),'yellow':('Yellow','黄色','黃色'),'lime':('Lime','黄绿色','淺綠色'),'pink':('Pink','粉红色','粉紅色'),'gray':('Gray','灰色','灰色'),'light_gray':('Light Gray','淡灰色','淺灰色'),'cyan':('Cyan','青色','青色'),'purple':('Purple','紫色','紫色'),'blue':('Blue','蓝色','藍色'),'brown':('Brown','棕色','棕色'),'green':('Green','绿色','綠色'),'red':('Red','红色','紅色'),'black':('Black','黑色','黑色')}
for key,row in colors.items():
 for material,words in {'carpet':('Carpet','地毯','地毯'),'wool':('Wool','羊毛','羊毛')}.items():
  terms['minecraft:'+key+'_'+material]=(row[0]+' '+words[0],row[1]+words[1],row[2]+words[2])
for key,row in {'oak':('Oak','橡木','橡木'),'birch':('Birch','白桦木','樺木'),'spruce':('Spruce','云杉木','杉木'),'dark_oak':('Dark Oak','深色橡木','黑橡木'),'cherry':('Cherry','樱花木','櫻花木')}.items():
 terms['minecraft:'+key+'_slab']=(row[0]+' Slab',row[1]+'台阶',row[2]+'半磚')
terms['minecraft:birch_sapling']=('Birch Sapling','白桦树苗','樺木樹苗')
for item,row in terms.items():
 for lc,value in zip(LOCALES,row):names[lc][item]=value
# Fail loudly instead of leaking English identifiers into Chinese instructions.
def label(item,lc):
 if item not in names[lc]:raise ValueError(f'Missing guide localization: {lc} {item}')
 return names[lc][item]

def main(*,write_audit=True):
 payload=loadjs(ROOT/'runtime/BP/scripts/payload.js')
 for recipe in payload['recipes']:
  if recipe['kind']!='shaker':continue
  src=ROOT/'upstream/data'/NS/'recipe'/(recipe['id'].split(':',1)[1]+'.json')
  if not src.exists():raise ValueError('Missing Java shaker source: '+str(src))
  recipe['ingredientTags']=[slot.get('tag') for slot in json.loads(src.read_text(encoding='utf-8'))['ingredients']]

 payload['version']='.'.join(str(v) for v in json.loads((ROOT/'runtime/BP/manifest.json').read_text(encoding='utf-8'))['header']['version'])
 freezers=loadjs(ROOT/'runtime/BP/scripts/freezer-recipes.js')
 recipe_by_id={r['id']:r for r in payload['recipes']}
 content_by_base={r.get('base',r.get('item')):r for r in payload['content']}
 item_crafts=collections.defaultdict(list)
 for path in sorted((ROOT/'runtime/BP/recipes').rglob('*.json')):
  data=json.loads(path.read_text(encoding='utf-8'));kind,recipe=next((k,v) for k,v in data.items() if k.startswith('minecraft:recipe_'))
  item_crafts[recipe['result']['item']].append((kind,recipe))
 out=[];audits=[]
 for old in payload['pages']:
  short=old['id'].split('/')[-1];base=NS+':'+short;content=content_by_base.get(base)
  kind='bottle' if content and content['kind']=='bottle' else 'cocktail' if content else 'freezer' if short=='freezer' else 'cabinet' if 'cabinet' in short else 'stool' if short.startswith('bar_stool_') else 'painting' if short.endswith('_painting') else 'mixer' if short in ('cola','tonic_water') else 'record' if short=='custom_record' else 'food'
  item=base+'_q1' if kind=='bottle' else base
  category={'bottle':'barrel','cocktail':'cocktail','freezer':'equipment','cabinet':'storage','stool':'furniture','painting':'art','record':'art','mixer':'ingredients','food':'food'}[kind]
  linked=[r for r in payload['recipes'] if r.get('output',{}).get('item')==item or item in r.get('output',{}).get('byQuality',[])]
  freezing=[r for r in freezers if r['result']['id']==item]
  crafting=[];craftrows={lc:[] for lc in LOCALES}
  for shape,c in item_crafts.get(item,[]):
   def part(v):return v.get('item') or '#'+v['tag']
   shaped='pattern' in c
   ingredients=[part(c['key'][ch]) for row in c['pattern'] for ch in row if ch!=' '] if shaped else [part(x) for x in c['ingredients']]
   # A tag is not a physical item icon. Keep exact tag acceptance in body and
   # use a verified example ONLY for the native diagram (marked as an example).
   diagram=[KT+':wine_q1' if i=='#'+KT+':alcohol' else i for i in ingredients]
   crafting.append({'method':'Crafting Table','ingredients':diagram,'count':c['result'].get('count',1),'time':0,'result':item})
   for lc in LOCALES:
    rows=craftrows[lc];rows.append(triple('Crafting Table • Shaped','工作台｜有序合成','工作台｜有序合成')[lc] if shaped else triple('Crafting Table • Shapeless','工作台｜无序合成','工作台｜無序合成')[lc])
    if shaped:
     rows.append(' / '.join(row.replace(' ','·') for row in c['pattern']))
     rows.extend(ch+' = '+label(part(v),lc) for ch,v in c['key'].items())
     rows.append(triple('· = empty slot; keep the shown arrangement.','· 表示空格，按图中相对位置摆放。','· 表示空格，按圖中相對位置擺放。')[lc])
    else:
     counts=collections.Counter(ingredients);rows.extend(label(i,lc)+' × '+str(n) for i,n in counts.items())
    rows.append(triple('Output','成品','成品')[lc]+'：'+label(item,lc)+' × '+str(c['result'].get('count',1)))
    if any(x.startswith('#') for x in ingredients):rows.append(triple('The native ingredient diagram uses wine as an example; all nine slots accept the alcohol tag stated above.','下方配方图以葡萄酒举例；九格实际均接受上述 alcohol 标签酒品。','下方配方圖以葡萄酒舉例；九格實際均接受上述 alcohol 標籤酒品。')[lc])
  mixable=any(x['item']==base+'_q4' for x in payload['shakerInputs'])
  body={lc:guide_body(short,kind,lc,mixable=mixable) for lc in LOCALES}
  for lc,prose in body.items():
   rows=[row for row in prose.split('\n') if row]
   if len(rows)>8 or any(len(row)>512 for row in rows):raise ValueError('Guide transport limit '+lc+' '+old['id'])
  preparations=[{'method':'Freezer','ingredients':[next((i for i,fluid in {'minecraft:water_bucket':'minecraft:water','minecraft:milk_bucket':NS+':milk_still',KT+':grape_bucket':KT+':grape_juice',KT+':sweet_berries_bucket':KT+':sweet_berries_juice'}.items() if fluid==r['fluid']),r['fluid']),*row],'result':item,'count':r['result'].get('count',1),'time':r['craft_time']} for r in freezing for row in __import__('itertools').product(*r['ingredients'])]
  out.append({**{k:v for k,v in old.items() if k not in ('crafting','preparations')},'item':item,'category':category,'title':{lc:label(item,lc) for lc in LOCALES},'body':body,'recipeIds':[r['id'] for r in linked],**({'preparations':preparations or crafting} if kind in ('food','mixer') and (preparations or crafting) else {})})
  audits.append({'id':old['id'],'item':item,'category':category,'recipeIds':[r['id']for r in linked],'crafting':len(crafting),'freezerRecipes':[r['id']for r in freezing]})
 payload['pages']=out;writejs(ROOT/'runtime/BP/scripts/payload.js','payload',payload)
 audit={'guideVersion':2,'pageCount':len(out),'categories':dict(collections.Counter(p['category']for p in out)),'registeredRecipes':dict(collections.Counter(r['kind']for r in payload['recipes'])),'recipeSource':'canonical runtime registry','freezerRecipes':len(freezers),'nativeCraftingRecipes':sum(len(p.get('crafting',[]))for p in out),'pages':audits}
 if write_audit:(ROOT/f"docs/GUIDE-AUDIT-{payload['version']}.json").write_text(json.dumps(audit,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
 print(json.dumps({k:v for k,v in audit.items()if k!='pages'},ensure_ascii=False))
if __name__=='__main__':main(write_audit='--no-audit' not in sys.argv)
