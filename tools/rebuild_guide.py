#!/usr/bin/env python3
"""Rebuild product guide only, from canonical runtime recipes and localizations.
Does not regenerate models, change recipes, or simulate Minecraft interactions.
"""
from pathlib import Path
import collections, json, re
ROOT=Path(__file__).resolve().parents[1]
TAV=ROOT.parent/'tavern-src'
NS='kaleidoscope_world_liquor'; KT='kaleidoscope_tavern'
LOCALES=('en_US','zh_CN','zh_TW')
def loadjs(path):
 return json.loads(path.read_text(encoding='utf-8').split('=',1)[1].strip().rstrip(';'))
def writejs(path,name,value):
 path.write_text('export const '+name+' = '+json.dumps(value,ensure_ascii=False,indent=2)+';\n',encoding='utf-8')
def triple(en,cn,tw):return dict(zip(LOCALES,(en,cn,tw)))
source=(TAV/'runtime/BP/scripts/data/cookery-guide-payload.js').read_text()
names=json.loads(re.search(r'const GUIDE_ITEM_NAMES=(.*);',source).group(1))
for pack in (TAV,ROOT):
 for lc in LOCALES:
  for row in (pack/f'runtime/RP/texts/{lc}.lang').read_text().splitlines():
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

def main():
 payload=loadjs(ROOT/'runtime/BP/scripts/payload.js')
 payload['version']='.'.join(str(v) for v in json.loads((ROOT/'runtime/BP/manifest.json').read_text())['header']['version'])
 freezers=loadjs(ROOT/'runtime/BP/scripts/freezer-recipes.js')
 recipe_by_id={r['id']:r for r in payload['recipes']}
 content_by_base={r.get('base',r.get('item')):r for r in payload['content']}
 item_crafts=collections.defaultdict(list)
 for path in sorted((ROOT/'runtime/BP/recipes').rglob('*.json')):
  data=json.loads(path.read_text());kind,recipe=next((k,v) for k,v in data.items() if k.startswith('minecraft:recipe_'))
  item_crafts[recipe['result']['item']].append((kind,recipe))
 # Reuse source effect names; duration=0 instant actions are not "0 second buffs".
 effects={lc:{} for lc in LOCALES}
 try:
  from opencc import OpenCC
  cc=OpenCC('s2t')
 except ImportError:
  cc=None
 for lc in LOCALES:
  for space in (NS,KT,'smc','kaleidoscope_twilight'):
   file=ROOT/f'upstream/assets/{space}/lang/{"zh_cn" if lc=="zh_TW" else lc.lower()}.json'
   if not file.exists():continue
   for key,value in json.loads(file.read_text()).items():
    if key.startswith('effect.'):
     key=key.replace('effect.smc.','effect.'+NS+'.').replace('effect.kaleidoscope_twilight.','effect.'+NS+'.')
     effects[lc][key]=cc.convert(value) if lc=='zh_TW' and cc else value
 effect_terms={
  'minecraft:hunger':('Hunger', '饥饿', '飢餓'),
  'minecraft:weakness':('Weakness', '虚弱', '虛弱'),
  'minecraft:absorption':('Absorption', '伤害吸收', '吸收'),
  'minecraft:health_boost':('Health Boost', '生命提升', '生命提升'),
  'minecraft:hero_of_the_village':('Hero of the Village', '村庄英雄', '村莊英雄'),
  'minecraft:levitation':('Levitation', '飘浮', '懸浮'),

  'minecraft:invisibility':('Invisibility','隐身','隱形'),
  'minecraft:nausea':('Nausea','恶心','噁心'), 'minecraft:speed':('Speed','速度','速度'),
  'minecraft:strength':('Strength','力量','力量'),'minecraft:regeneration':('Regeneration','生命恢复','生命恢復'),
  'minecraft:instant_health':('Instant Health','瞬间治疗','瞬間治療'),'minecraft:resistance':('Resistance','抗性提升','抗性提升'),
  'minecraft:fire_resistance':('Fire Resistance','抗火','抗火'),'minecraft:night_vision':('Night Vision','夜视','夜視'),
  'minecraft:jump_boost':('Jump Boost','跳跃提升','跳躍提升'),'minecraft:slow_falling':('Slow Falling','缓降','緩降'),
  'minecraft:water_breathing':('Water Breathing','水下呼吸','水下呼吸'),'minecraft:haste':('Haste','急迫','挖掘加速'),
  'minecraft:luck':('Luck (Java-only; unavailable here)','幸运（Java 专属，本移植未提供）','幸運（Java 專屬，本移植未提供）'),
  KT+':slightly_tipsy':('Slightly Tipsy','微醺','微醺')}
 for item,row in effect_terms.items():
  for lc,value in zip(LOCALES,row):effects[lc]['effect.'+item.replace(':','.')]=value
 def effect_text(e,lc):
  key='effect.'+e['effect'].replace(':','.')
  if key not in effects[lc]:raise ValueError('Missing effect name '+lc+' '+key)
  value=effects[lc][key]
  level=str(e['amplifier']+1);chance=f"{e['probability']*100:g}%"
  instant=e['effect'].split(':')[-1] in {'crazy','explosion','level_boost','respawn','instant_health','instant_damage'}
  duration=triple('instant','即时触发','即時觸發')[lc] if instant else f"{e['duration']:g}"+triple('s','秒','秒')[lc]
  value+=f' {level}（{duration}，{chance}）'
  if e['effect'].endswith((':hostile_detection',':treasure_sense')):
   value+=triple(' [outline unavailable in this port]','【本移植未实现透视描边】','【本移植未實作透視描邊】')[lc]
  return value
 usages={
 'bottle':triple('Open the Tavern barrel by sneaking. Add four matching fluid buckets FIRST (4000 mB), then the listed ingredients. Close the lid to start. Extract each bottle using one empty Tavern bottle. Keep a batch in the loaded barrel to improve its quality.','潜行操作酒桶开盖，先加四桶同种液体（4000 mB），再加所列原料。关盖开始发酵，每瓶用一个空酒瓶接取；留在已加载的酒桶内可继续提升品质。','潛行操作酒桶開蓋，先加四桶同種液體（4000 mB），再加所列原料。關蓋開始發酵，每瓶用一個空酒瓶接取；留在已載入的酒桶內可繼續提升品質。'),
 'cocktail':triple('Use the same shaker workflow as Tavern: place the shaker, add one item for each of its THREE slots, take it with an empty hand, then hold use while aiming into air. Release in the recipe timing window. Place an empty glass, use the filled shaker ON THAT GLASS to pour, then empty-hand use the finished glass to pick it up.','与酒馆本体相同：放置雪克杯，三槽各投入一份原料，空手取回，朝空气按住使用；在配方时机区间松手。先摆空玻璃杯，再持已调好的雪克杯对准空杯倒酒，最后空手拿起成品。','與酒館本體相同：放置雪克杯，三槽各投入一份原料，空手取回，朝空氣按住使用；在配方時機區間鬆手。先擺空玻璃杯，再持已調好的雪克杯對準空杯倒酒，最後空手拿起成品。'),
 'freezer':triple('Sneak-use the freezer to open or close its lid; leave the block above clear. While open, add ONE matching fluid bucket (1000 mB), then one item for EACH listed ingredient slot in order. Close the lid to start. Open after completion and take the products one at a time. Use an empty hand to remove the last input, or an empty bucket to drain unused fluid.','潜行操作冷冻柜开关盖，上方须留空。开盖后放入一桶对应液体（1000 mB），按原料槽顺序每槽投入一份，关盖开始。完成后开盖逐个取出；空手退回最后一份原料，空桶可退回未消耗的液体。','潛行操作冷凍櫃開關蓋，上方須留空。開蓋後放入一桶對應液體（1000 mB），按原料槽順序每槽投入一份，關蓋開始。完成後開蓋逐個取出；空手退回最後一份原料，空桶可退回未消耗的液體。'),
 'cabinet':triple('Use a bottle on the desired cabinet slot to store it; use that slot with an empty hand to retrieve it. Matching neighboring cabinets connect visually. Bar cabinets have two slots (a wide bottle uses both); cellar cabinets have nine slots and accept compatible compact bottles only.','手持酒瓶点击目标格存入，空手点击该格取回。同款相邻酒柜可连接显示；吧台酒柜有两格（宽瓶独占），地窖酒柜有九格，仅收兼容的小型酒瓶。','手持酒瓶點擊目標格存入，空手點擊該格取回。同款相鄰酒櫃可連接顯示；吧台酒櫃有兩格（寬瓶獨佔），地窖酒櫃有九格，僅收相容的小型酒瓶。'),
 'stool':triple('Place the stool, then use it with an empty hand while NOT sneaking to sit. Dismount normally to get up.','摆放后，非潜行状态下空手使用即可坐下；使用正常的下坐骑操作起身。','擺放後，非潛行狀態下空手使用即可坐下；使用正常的下坐騎操作起身。'),
 'painting':triple('Craft it using the recipe below and place it on a supporting surface.','按下方工作台配方合成，再放在支撑表面。','按下方工作台配方合成，再放在支撐表面。'),
 'mixer':triple('Craft this mixer on a crafting table, not in a barrel or freezer. It has no Q1–Q6 quality stages. A recipe slot that lists it accepts one mixer; it does not replace every alcohol slot.','这是工作台合成的调酒辅料，不经过酒桶或冷冻柜，也没有 Q1–Q6 品质。只有明确列出它的配方槽才可投入一份，不能任意替换所有基酒。','這是工作台合成的調酒輔料，不經過酒桶或冷凍櫃，也沒有 Q1–Q6 品質。只有明確列出它的配方槽才可投入一份，不能任意替換所有基酒。'),
 'record':triple('Use it on an empty jukebox to choose randomly between the two included Java tracks. Use the jukebox with an empty hand to retrieve it. It can also be hung on a wall and retrieved with an empty hand.','对空唱片机使用，随机播放附带的两首 Java 曲目之一；空手操作唱片机可取回。也可悬挂于墙面，空手取回。','對空唱片機使用，隨機播放附帶的兩首 Java 曲目之一；空手操作唱片機可取回。也可懸掛於牆面，空手取回。'),
 'food':triple('Make this food using the workstation and recipe shown below, then hold use to eat it.','按下方指定的工作站与配方制作，再按住使用食用。','按下方指定的工作站與配方製作，再按住使用食用。')}
 out=[];audits=[]
 for old in payload['pages']:
  short=old['id'].split('/')[-1];base=NS+':'+short;content=content_by_base.get(base)
  kind='bottle' if content and content['kind']=='bottle' else 'cocktail' if content else 'freezer' if short=='freezer' else 'cabinet' if 'cabinet' in short else 'stool' if short.startswith('bar_stool_') else 'painting' if short.endswith('_painting') else 'mixer' if short in ('cola','tonic_water') else 'record' if short=='custom_record' else 'food'
  item=base+'_q1' if kind=='bottle' else base
  category={'bottle':'barrel','cocktail':'cocktail','freezer':'equipment','cabinet':'storage','stool':'furniture','painting':'art','record':'art','mixer':'cocktail','food':'food'}[kind]
  linked=[r for r in payload['recipes'] if r.get('output',{}).get('item')==item or item in r.get('output',{}).get('byQuality',[])]
  freezing=freezers if kind=='freezer' else [r for r in freezers if r['result']['id']==item]
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
  body={}
  for lc in LOCALES:
   rows=[usages[kind][lc]]+craftrows[lc]
   if kind=='bottle':
    r=linked[0]
    unit=r.get('unitTime',2400)/20
    rows.append(triple(f'Aging base time: {unit:g}s; each next stage takes base time × current quality, plus loaded-block update rounding. Q6 is the maximum.',f'熟成基础时间：{unit:g} 秒；下一品质耗时为基础时间乘当前品质，另有方块更新取整。最高 Q6。',f'熟成基礎時間：{unit:g} 秒；下一品質耗時為基礎時間乘目前品質，另有方塊更新取整。最高 Q6。')[lc])
    mixable=any(x['item']==base+'_q4' for x in payload['shakerInputs'])
    rows.append(triple('Only Q4–Q6 bottles accepted by the shaker input table may be used for mixology.','只有注册为调酒材料的 Q4–Q6 酒品才能投入雪克杯。','只有註冊為調酒材料的 Q4–Q6 酒品才能投入雪克杯。')[lc] if mixable else triple('This bottled drink is not registered as a shaker input.','此瓶装饮品未注册为雪克杯原料。','此瓶裝飲品未註冊為雪克杯原料。')[lc])
   for r in freezing:
    rows.append(triple('Freezer recipe','冷冻柜配方','冷凍櫃配方')[lc]+'：'+label(r['result']['id'],lc))
    rows.append(triple('Fluid','液体','液體')[lc]+'：'+label(r['fluid'],lc)+' '+str(r.get('fluid_amount',1000))+' mB')
    for j,slot in enumerate(r['ingredients'],1):rows.append(triple('Input slot','原料槽','原料槽')[lc]+f' {j}：'+' / '.join(label(i,lc) for i in slot)+' × 1')
    if not r['ingredients']:rows.append(triple('No ingredient items.','无需固体原料。','無需固體原料。')[lc])
    rows.append(triple('Output','成品','成品')[lc]+'：'+label(r['result']['id'],lc)+' × '+str(r['result'].get('count',1)))
    rows.append(triple('Time','时间','時間')[lc]+f"：{r['craft_time']/20:g}"+triple('s nominal; completion is rounded by the 80-tick loaded-block update cadence.','秒（标称；完成时刻受 80 tick 方块更新节奏影响）。','秒（標稱；完成時刻受 80 tick 方塊更新節奏影響）。')[lc])
    carrier=r.get('extract_condition',{}).get('item')
    rows.append((triple('Extraction carrier (not an ingredient)','取出容器（不是原料）','取出容器（不是原料）')[lc]+'：'+label(carrier,lc)+' × 1') if carrier else triple('Extract after opening; no carrier item required.','完成后开盖取出，无需额外容器。','完成後開蓋取出，無需額外容器。')[lc])
   if content:
    groups=content['effects'] if kind=='bottle' else [content['effects']]
    rows.append(triple('Drink effects (independent probability per effect)','饮用效果（各效果独立判定）','飲用效果（各效果獨立判定）')[lc])
    for quality,group in enumerate(groups,1):
     prefix=(triple('Quality','品质','品質')[lc]+f' {quality}：') if kind=='bottle' else ''
     rows.append(prefix+('；'.join(effect_text(e,lc) for e in group) or triple('No listed effects.','无额外效果。','無額外效果。')[lc]))
   body[lc]='\n'.join(rows)
   if len(body[lc])>8192:raise ValueError('Page too long '+old['id'])
  out.append({**old,'item':item,'category':category,'title':{lc:label(item,lc) for lc in LOCALES},'body':body,'recipeIds':[r['id'] for r in linked],**({'crafting':crafting} if crafting else {})})
  audits.append({'id':old['id'],'item':item,'category':category,'recipeIds':[r['id']for r in linked],'crafting':len(crafting),'freezerRecipes':[r['id']for r in freezing]})
 payload['pages']=out;writejs(ROOT/'runtime/BP/scripts/payload.js','payload',payload)
 audit={'guideVersion':2,'pageCount':len(out),'categories':dict(collections.Counter(p['category']for p in out)),'registeredRecipes':dict(collections.Counter(r['kind']for r in payload['recipes'])),'recipeSource':'canonical runtime registry','freezerRecipes':len(freezers),'nativeCraftingRecipes':sum(len(p.get('crafting',[]))for p in out),'pages':audits}
 (ROOT/'docs/GUIDE-AUDIT-0.1.6.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({k:v for k,v in audit.items()if k!='pages'},ensure_ascii=False))
if __name__=='__main__':main()
