#!/usr/bin/env python3
"""Compile pinned Java content, retaining source geometry, recipes and effect rows."""
import copy,json,hashlib,re,shutil,sys,uuid,math
from pathlib import Path
from PIL import Image
from opencc import OpenCC
import java_geometry as geo
ROOT=Path(__file__).resolve().parents[1];UP=ROOT/'upstream';RT=ROOT/'runtime';BP=RT/'BP';RP=RT/'RP'
TAV=ROOT.parent/'tavern-src';NS='kaleidoscope_world_liquor';KT='kaleidoscope_tavern';VERSION=[0,1,4];TAV_VERSION=[0,6,39];cc=OpenCC('s2t')
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def write(p,d):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
def js(p,name,d):p.parent.mkdir(parents=True,exist_ok=True);p.write_text('export const '+name+' = '+json.dumps(d,ensure_ascii=False,indent=2)+';\n')
def ident(x):
 return {'minecraft:item_frame':'minecraft:frame','minecraft:magma_block':'minecraft:magma','minecraft:snow_block':'minecraft:snow','minecraft:slime_ball':'minecraft:slime_ball','minecraft:lily_of_the_valley':'minecraft:lily_of_the_valley'}.get(x, NS+':'+x.split(':')[1] if x.startswith(('smc:','kaleidoscope_twilight:')) or (x.startswith(KT+':') and x.endswith('_painting') and x.split(':')[1] in paintings) else x)
langs={}
for lc in ['en_US','zh_CN','zh_TW']:
 langs[lc]={}
 for space in ['kaleidoscope_world_liquor','smc','kaleidoscope_twilight','kaleidoscope_tavern']:
  p=UP/f'assets/{space}/lang/{"zh_cn" if lc=="zh_TW" else lc.lower()}.json'
  if p.exists():langs[lc].update({k:cc.convert(v) if lc=='zh_TW' else v for k,v in read(p).items()})
texts={lc:{} for lc in langs};items_tex={};terrain={};models={};geometry_cache={};allitems={};content=[];pages=[];recipes=[];inputs=[];audit={};modelspec={}
# Bedrock scans block/entity geometry from the recognized model directories.
# An arbitrary models/kwl directory packaged successfully but registered none
# of its geometry on clients, even though BDS could load the behavior pack.
legacy=RP/'models/kwl'
if legacy.exists():shutil.rmtree(legacy)
(RP/'models/entity').mkdir(parents=True,exist_ok=True)
for stale in (RP/'models/entity').glob('kwl_g_*.geo.json'):stale.unlink()
java_alcohol={x.split(':')[1] for x in read(UP/f'data/{KT}/tags/item/alcohol.json')['values'] if x.startswith(NS+':')}
paintings=['bfxm_painting','bmt_painting','dream_painting','cha_painting','chen_painting','rabbit_painting','ch_painting','qxxy_painting']
def name(item,lc):
 old=item
 if item.split(':')[1] in paintings:old=KT+':'+item.split(':')[1]
 if item.endswith(':ice_tea'):old='smc:ice_tea'
 if item.split(':')[1] in ['liangshan_ice_cone','kita_stuffed_crisp','pochi_pudding','magic_crispy_corner']:old='kaleidoscope_twilight:'+item.split(':')[1]
 value=langs[lc].get('item.'+old.replace(':','.'),langs[lc].get('block.'+old.replace(':','.'),item.split(':')[1].replace('_',' ').title()))
 short=item.split(':')[1]
 if short.startswith('spruce_') and lc!='en_US':value=value.replace('深色橡木木','雲杉木' if lc=='zh_TW' else '云杉木').replace('深色橡木','雲杉木' if lc=='zh_TW' else '云杉木')
 if short.startswith('dark_oak_') and lc!='en_US':value=value.replace('雲杉木','深色橡木').replace('云杉木','深色橡木')
 if short=='custom_record' and lc!='en_US':value='酒館唱片' if lc=='zh_TW' else '酒馆唱片'
 if short in paintings:
  creator=langs[lc].get('tooltip.'+old.replace(':','.'),short.replace('_painting',''))
  value=value+' · '+creator
 return value
def localized(item):return {lc:name(item,lc) for lc in langs}
def model(mid):
 if mid in models:return models[mid]
 m=geo.resolve_model(mid)
 for e in m.get('elements',[]):
  rot=e.get('rotation',{})
  if rot.get('rescale'):
   scale=1/math.cos(math.radians(rot['angle']));axis='xyz'.index(rot['axis']);pivot=rot['origin']
   for edge in ['from','to']:
    e[edge]=[v if j==axis else pivot[j]+(v-pivot[j])*scale for j,v in enumerate(e[edge])]
   rot['rescale']=False
 # Authored mixed-axis reversed boxes are lowered into original one-sided face planes.
 m,changes=geo.lower_mixed_axis_surfaces(m)
 m,uvchanges=geo.lower_uv_half_turns(m,allow_quarter_turns=True)
 key=mid.replace(':','__').replace('/','__');atlas=RP/f'textures/kwl/generated/{key}.png'
 placement=geo.build_atlas(m,atlas);g=geo.geometry(m,key,placement,[[0,0]],allow_native_uv_rotation=True)
 for bone in g['minecraft:geometry'][0]['bones']:
  for cube in bone.get('cubes',[]):
   for uv in cube['uv'].values():uv['material_instance']='default'
 # Geometry describes shape and UVs, while the atlas texture is selected by
 # the block or render controller. Most Java color/wood variants share one
 # shape. Reuse it and keep identifiers short for Bedrock client registration.
 g['minecraft:geometry'][0]['description']['identifier']=''
 fingerprint=hashlib.sha256(json.dumps(g,sort_keys=True,separators=(',',':')).encode()).hexdigest()[:16]
 if fingerprint not in geometry_cache:
  g['minecraft:geometry'][0]['description']['identifier']='geometry.kwl.g_'+fingerprint
  write(RP/f'models/entity/kwl_g_{fingerprint}.geo.json',g)
  geometry_cache[fingerprint]=g
 else:g=geometry_cache[fingerprint]
 texture='kwl_'+key;terrain[texture]={'textures':str(atlas.relative_to(RP).with_suffix(''))}
 result={'geometry':g['minecraft:geometry'][0]['description']['identifier'],'texture':texture,'path':str(atlas.relative_to(RP).with_suffix('')),'model':m,'data':g}
 models[mid]=result;audit[mid]={'inwardSurfaces':changes,'uvLowering':uvchanges};return result

def rendericon(key,modelinfo):
 sys.path.insert(0,str(TAV/'art/tools'));import render_preview as preview
 g=modelinfo['data']['minecraft:geometry'][0];tex=Image.open(RP/(modelinfo['path']+'.png')).convert('RGBA')
 # Same source-to-icon rasterizer used by Tavern, preserving transparent texels.
 vertices=preview.decode_geo(g)
 faces=preview.all_faces(vertices)
 # API read below; supplied after generator bootstrap.
 return None

def icon(item,javaitem=None,modelinfo=None):
 short=item.split(':')[1];javaitem=javaitem or item;p=UP/f'assets/{javaitem.split(":")[0]}/models/item/{javaitem.split(":")[1]}.json'
 src=None
 if p.exists():
  d=read(p);layer=d.get('textures',{}).get('layer0')
  if layer and not layer.startswith('#'):src=geo.resource_path(layer,'textures')
 if src and src.exists():
  dst=RP/f'textures/kwl/items/{short}.png';dst.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(src,dst);path=str(dst.relative_to(RP).with_suffix(''))
 elif modelinfo:
  # generated block item uses native item_visual; guide receives a rendered model icon below
  path=modelinfo['path']
 else:raise ValueError(('Missing source item artwork',item,javaitem))
 items_tex['kwl_'+short]={'textures':path};return 'kwl_'+short

def item(item,kind='plain',javaitem=None,modelinfo=None):
 short=item.split(':')[1];tex=icon(item,javaitem,modelinfo)
 c={'minecraft:display_name':{'value':'item.'+item+'.name'},'minecraft:icon':tex,'minecraft:max_stack_size':16 if kind in ['bottle','cocktail','drink'] else 64}
 if kind=='bottle' and short.rsplit('_q',1)[0] in java_alcohol:c['minecraft:tags']={'tags':[KT+':alcohol']}
 if kind in ['bottle','cocktail','drink']:
  c.update({'minecraft:use_animation':'drink','minecraft:use_modifiers':{'use_duration':1.6,'movement_modifier':.35,'start_using':'if_first'},KT+':drink_effects' if kind=='bottle' else KT+':cocktail_effects' if kind=='cocktail' else NS+':consume':{}})
 elif kind=='block':c['minecraft:block_placer']={'block':item,'replace_block_item':False}
 # Match Tavern's creative inventory: quality variants stay out of the broad
 # equipment list, while mixable drinks and decor share Tavern's groups.
 group=('kaleidoscope_cookery:itemGroup.name.foods' if kind=='food' else KT+':itemGroup.name.'+('cocktails' if kind=='cocktail' else 'wines' if kind=='drink' or kind=='bottle' else 'tavern_decor'))
 category=None if kind=='bottle' and not short.endswith('_q6') else {'category':'equipment','group':group}
 description={'identifier':item}
 if category:description['menu_category']=category
 d={'format_version':'1.26.50','minecraft:item':{'description':description,'components':c}}
 write(BP/f'items/{short}.json',d);allitems[item]=d
 for lc in langs:texts[lc]['item.'+item+'.name']=name(javaitem or item,lc)
 return d

def block(identifier,mi,kind,states=None,perms=None):
 materials={'*':{'texture':mi['texture'],'render_method':'alpha_test_single_sided','face_dimming':True,'ambient_occlusion':0},'default':{'texture':mi['texture'],'render_method':'alpha_test_single_sided','face_dimming':False,'ambient_occlusion':0}}
 c={'minecraft:geometry':{'identifier':mi['geometry']},'minecraft:material_instances':materials,'minecraft:collision_box':False if kind in ['bottle','cocktail'] else {'origin':[-8,0,-8],'size':[16,16,16]},'minecraft:selection_box':{'origin':[-7,0,-7],'size':[14,16,14]},'minecraft:destructible_by_mining':{'seconds_to_destroy':.6},'minecraft:destructible_by_explosion':False,'minecraft:loot':'loot_tables/empty.json','minecraft:movable':{'movement_type':'immovable'}}
 if kind=='bottle':c[KT+':bottle_display']={}
 elif kind=='cocktail':c[KT+':cocktail_cup']={};c['minecraft:tick']={'interval_range':[20,20],'looping':True}
 else:c[NS+':furniture']={};c['minecraft:tick']={'interval_range':[80,80],'looping':True}
 d={'format_version':'1.26.50','minecraft:block':{'description':{'identifier':identifier,'menu_category':{'category':'none'},'states':states or {KT+':facing':[0,1,2,3]}},'components':c,'permutations':perms or []}}
 for facing in range(1,4):d['minecraft:block']['permutations'].append({'condition':f"q.block_state('{KT}:facing') == {facing}",'components':{'minecraft:transformation':{'rotation':[0,[-0,-90,180,90][facing],0]}}})
 
 for perm in d['minecraft:block']['permutations']:
  mats=perm['components'].get('minecraft:material_instances')
  if mats and '*' in mats:mats['default']=copy.deepcopy(mats['*'])
 write(BP/f'blocks/{identifier.split(":")[1]}.json',d);return d

effectdir=UP/f'data/{NS}/datamap/drink_effect'
effects={ident(d['item']):d['effects'] for p in effectdir.glob('*.json') for d in [read(p)]}
for p in (UP/'data/smc/datamap/drink_effect').glob('*.json'):
 d=read(p);effects[ident(d['item'])]=d['effects']
barrels=list((UP/f'data/{NS}/recipe/barrel').glob('*.json'))
bottleids=sorted({ident(read(p)['result']['id']) for p in barrels});cocktailids=sorted({ident(read(p)['result']['id']) for p in (UP/f'data/{NS}/recipe/shaker').glob('*.json')})
for rows in effects.values():
 for row in rows:
  for effect in row:effect['effect']=ident(effect['effect'])
blocked=read(UP/f'data/{KT}/tags/item/cellar_cabinet_blocklist.json')['values']
for n,base in enumerate(bottleids):
 short=base.split(':')[1];space='smc' if short=='ice_tea' else NS
 state=read(UP/f'assets/{space}/blockstates/{short}.json')['variants']; variants={}
 for k,v in state.items():
  props=dict(x.split('=') for x in k.split(','));variants[int(props['count'])]=v['model']
 shape=[];first=None
 for count,mid in sorted(variants.items()):
  mi=model(mid);first=first or mi;shape.append({'condition':f"q.block_state('{KT}:count') == {count}",'components':{'minecraft:geometry':{'identifier':mi['geometry']},'minecraft:material_instances':{'*':{'texture':mi['texture'],'render_method':'alpha_test_single_sided','ambient_occlusion':0,'face_dimming':False}}}})
 blockid=NS+':bottle_'+short;block(blockid,first,'bottle',{KT+':count':list(sorted(variants)),KT+':facing':[0,1,2,3]},shape)
 ids=[base+f'_q{q}' for q in range(1,7)]
 for q,i in enumerate(ids,1):
  d=item(i,'bottle',space+':'+short,first)
  # Tavern's own quality bottles use the same visible name at all grades;
  # quality is carried by the item ID and Tavern's quality UI/effect logic.
  for lc in langs:texts[lc]['item.'+i+'.name']=name(base,lc)
 descriptor={'kind':'bottle','base':base,'block':blockid,'items':ids,'effects':effects[base],'maxCount':max(variants),'compact':(space+':'+short) not in blocked,'visualKind':1000+n,'visuals':{key:NS+':'+key for key in ['holder_bottle_visual','cellar_cabinet_bottle_visual','tilted_rack_bottle_visual','circular_rack_bottle_visual','bar_cabinet_bottle_visual','thrown_drink']}}
 content.append(descriptor);modelspec[base]=first
for i in cocktailids:
 if not i.startswith(NS+':'):continue
 short=i.split(':')[1];state=read(UP/f'assets/{NS}/blockstates/{short}.json')['variants'];mid=next(iter(state.values()))['model'];mi=model(mid);modelspec[i]=mi
 blockid=NS+':cup_'+short;block(blockid,mi,'cocktail');item(i,'cocktail',modelinfo=mi);content.append({'kind':'cocktail','item':i,'block':blockid,'effects':effects[i][0]})
# Additional machine/furniture items and their source-selected block models.
furniture=[*(f'bar_stool_{c}' for c in ['white','orange','magenta','light_blue','yellow','lime','pink','gray','light_gray','cyan','purple','blue','brown','green','red','black']),*(f'{w}_{cab}' for w in ['oak','birch','spruce','dark_oak','cherry'] for cab in ['bar_cabinet','cellar_cabinet']),'freezer']
for short in furniture:
 i=NS+':'+short;st=read(UP/f'assets/{NS}/blockstates/{short}.json')['variants'];mid=next(iter(st.values()))['model'];mi=model(mid);modelspec[i]=mi;block(i,mi,'furniture');item(i,'block',modelinfo=mi)
for short in ['cola','tonic_water']:item(NS+':'+short,'drink')
# Emit deterministic metadata early; recipes and helper models follow below.
write(ROOT/'docs/conversion-audit.json',audit)
js(BP/'scripts/content.js','CONTENT',content)
write(ROOT/'docs/item-inventory.json',{'bottles':bottleids,'cocktails':cocktailids,'furniture':furniture})
write(RP/'textures/item_texture.json',{'resource_pack_name':'World Liquor','texture_name':'atlas.items','texture_data':items_tex})
write(RP/'textures/terrain_texture.json',{'resource_pack_name':'World Liquor','texture_name':'atlas.terrain','texture_data':terrain})
for lc,rows in texts.items():
 (RP/'texts').mkdir(exist_ok=True);(RP/f'texts/{lc}.lang').write_text('\n'.join(k+'='+v for k,v in rows.items())+'\n')
print('Compiled source models',len(models),'items',len(allitems))
# Render block-only item icons from their own geometry; never expose a texture atlas as an icon.
import importlib.util
spec=importlib.util.spec_from_file_location('preview',TAV/'art/tools/render_preview.py');preview=importlib.util.module_from_spec(spec);spec.loader.exec_module(preview)
for i,mi in modelspec.items():
 if i not in allitems:continue
 key='kwl_'+i.split(':')[1]
 if items_tex[key]['textures']!=mi['path']:continue
 faces=preview.all_faces(preview.decode_geo(mi['data']));im=preview.raster(faces,Image.open(RP/(mi['path']+'.png')).convert('RGBA'),size=96,yaw=35,pitch=25,cull=True)
 dst=RP/f'textures/kwl/items/{i.split(":")[1]}.png';dst.parent.mkdir(parents=True,exist_ok=True);im.save(dst);items_tex[key]={'textures':str(dst.relative_to(RP).with_suffix(''))}
# Model selection on the furniture follows source open/connected states.
for short in furniture:
 p=BP/f'blocks/{short}.json';d=read(p)['minecraft:block'];st=read(UP/f'assets/{NS}/blockstates/{short}.json')['variants']
 d['description']['states'].update({NS+':open':[False,True]} if short=='freezer' else {NS+':position':['single','left','middle','right']} if 'cabinet' in short else {})
 seen=set()
 for props,v in st.items():
  props=dict(x.split('=') for x in props.split(','));key='open' if short=='freezer' else 'position'
  if key not in props or props[key] in seen:continue
  seen.add(props[key]);mi=model(v['model']);value=props[key];expr=value if key=='open' else "'"+value+"'"
  d['permutations'].append({'condition':f"q.block_state('{NS}:{key}') == {expr}",'components':{'minecraft:geometry':{'identifier':mi['geometry']},'minecraft:material_instances':{'*':{'texture':mi['texture'],'render_method':'alpha_test_single_sided','face_dimming':True,'ambient_occlusion':0}}}})
 if 'bar_stool' in short:d['components']['minecraft:collision_box']={'origin':[-6,0,-6],'size':[12,15,12]};d['components']['minecraft:selection_box']={'origin':[-6,0,-6],'size':[12,15,12]}
 
 for perm in d['permutations']:
  mats=perm['components'].get('minecraft:material_instances')
  if mats and '*' in mats:mats['default']=copy.deepcopy(mats['*'])
 write(p,{'format_version':'1.26.50','minecraft:block':d})
# Bottle visual actors retain Tavern's storage poses, with this pack's geometry and textures.
for mode in ['holder','cellar_cabinet','tilted_rack','circular_rack','bar_cabinet','thrown_drink']:
 file='runtime_thrown_drink.entity.json' if mode=='thrown_drink' else f'runtime_{mode}_bottle_visual.entity.json'
 actor='thrown_drink' if mode=='thrown_drink' else mode+'_bottle_visual'
 bp=read(TAV/f'runtime/BP/entities/{actor}.json');desc=bp['minecraft:entity']['description'];desc['identifier']=NS+':'+actor
 for prop in desc['properties'].values():
  if prop.get('type')=='int':prop['range']=[1000,1000+len(bottleids)-1];prop['default']=1000
 write(BP/f'entities/{actor}.json',bp)
 rp=read(TAV/f'runtime/RP/entity/{file}');desc=rp['minecraft:client_entity']['description'];desc['identifier']=NS+':'+actor;desc['geometry']={};desc['textures']={};desc['materials']={'default':'entity_alphatest_one_sided'}
 for n,base in enumerate(bottleids):desc['geometry'][f'kind_{n}']=modelspec[base]['geometry'];desc['textures'][f'kind_{n}']=modelspec[base]['path']
 rc='controller.render.kwl.'+mode;desc['render_controllers']=[rc];write(RP/f'entity/{actor}.entity.json',rp)
 prop=KT+(':holder_kind' if mode=='holder' else ':storage_kind');index=f"math.clamp(q.property('{prop}') - 1000, 0, {len(bottleids)-1})"
 write(RP/f'render_controllers/{mode}.json',{'format_version':'1.8.0','render_controllers':{rc:{'arrays':{'geometries':{'Array.models':[f'Geometry.kind_{n}' for n in range(len(bottleids))]},'textures':{'Array.textures':[f'Texture.kind_{n}' for n in range(len(bottleids))]}},'geometry':f'Array.models[{index}]','textures':[f'Array.textures[{index}]'],'materials':[{'*':'Material.default'}]}}})
# Preserve original crafting / machine recipes. Source example recipes are not registered content.
colors={'black':0x000000,'dark_blue':0x0000aa,'dark_green':0x00aa00,'dark_aqua':0x00aaaa,'dark_red':0xaa0000,'dark_purple':0xaa00aa,'gold':0xffaa00,'gray':0xaaaaaa,'dark_gray':0x555555,'blue':0x5555ff,'green':0x55ff55,'aqua':0x55ffff,'red':0xff5555,'light_purple':0xff55ff,'yellow':0xffff55,'white':0xffffff}
inputtags={};inputcolor={}
for p in (UP/f'data/{KT}/tags/item').glob('cocktail_ingredient_*.json'):
 vals=[ident(x) for x in read(p)['values'] if isinstance(x,str)];inputtags[KT+':'+p.stem]=vals
 for i in vals:inputcolor[i]=colors[p.stem.removeprefix('cocktail_ingredient_')]
# Source Tavern tag options use its adapted quality items and native potion aliases.
import subprocess
coreinputs=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {SHAKER_INPUTS} from './runtime/BP/scripts/data/mixology.js';console.log(JSON.stringify(SHAKER_INPUTS))"],cwd=TAV,text=True))
for i,color in inputcolor.items():
 ids=[i+f'_q{q}' for q in range(4,7)] if i in bottleids else [i]
 for itemid in ids:
  q=int(itemid[-1]) if i in bottleids else 1
  rows=effects[i][q-1] if i in effects else [{'effect':'minecraft:regeneration' if i.endswith('tonic_water') else 'minecraft:haste','duration':15,'amplifier':0,'probability':1}]
  inputs.append({'item':itemid,'container':KT+':empty_bottle' if i in bottleids else 'minecraft:glass_bottle','color':color,'effects':rows})
flowers=['dandelion','poppy','blue_orchid','allium','azure_bluet','red_tulip','orange_tulip','white_tulip','pink_tulip','oxeye_daisy','cornflower','lily_of_the_valley','wither_rose','sunflower','lilac','rose_bush','peony','torchflower','pitcher_plant']
def ingredient(d):
 if 'item' in d:
  i=ident(d['item']);return [i+f'_q{q}' for q in range(4,7)] if i in bottleids else [i]
 tag=d['tag']
 if tag.startswith(KT+':cocktail_ingredient_'):
  color=colors[tag.split('cocktail_ingredient_')[1]]
  return list(dict.fromkeys([*(i for i,v in coreinputs.items() if v['color']==color),*(x['item'] for x in inputs if x['color']==color)]))
 if tag=='minecraft:flowers':return ['minecraft:'+x for x in flowers]
 if tag=='minecraft:planks':return ['minecraft:'+x+'_planks' for x in ['oak','spruce','birch','jungle','acacia','dark_oak','mangrove','cherry','bamboo','crimson','warped','pale_oak']]
 raise ValueError(('Unresolved recipe tag',tag))
freezers=[];crafts=[]
for p in sorted((UP/f'data/{NS}/recipe').rglob('*.json')):
 d=read(p);typ=d['type'];rid=NS+':'+p.relative_to(UP/f'data/{NS}/recipe').with_suffix('').as_posix()
 if typ==KT+':barrel':
  result=ident(d['result']['id']);recipes.append({'id':rid,'kind':'barrel','title':localized(result),'fluid':d['fluid'],'ingredients':[ingredient(x) for x in d.get('ingredients',[])],'carrier':ident(d['carrier']['item']),'unitTime':d['unit_time'],'output':{'byQuality':[result+f'_q{q}' for q in range(1,7)]}})
 elif typ==KT+':shaker':recipes.append({'id':rid,'kind':'shaker','title':localized(ident(d['result']['id'])),'ingredients':[ingredient(x) for x in d['ingredients']],'output':{'item':ident(d['result']['id'])}})
 elif typ==NS+':freezer':freezers.append({**d,'id':rid,'result':{**d['result'],'id':ident(d['result']['id'])},'ingredients':[ingredient(x) for x in d['ingredients']]})
 elif typ.startswith('minecraft:crafting_'):
  result=ident(d['result']['id']);ingredients=d.get('ingredients',[])+list(d.get('key',{}).values());converted=[]
  for ing in ingredients:
   converted.append({'item':ident(ing['item'])} if 'item' in ing else {'tag':ing['tag']})
  obj={'description':{'identifier':rid.replace('/','_')},'tags':['crafting_table'],'result':{'item':result,'count':d['result'].get('count',1)}}
  if 'pattern' in d:obj.update(pattern=d['pattern'],key=dict(zip(d['key'],converted)))
  else:obj['ingredients']=converted
  # Crafting accepts all qualities only where Java accepts a DrinkBlockItem (no recipe here uses one).
  obj['unlock']=[{'item':'minecraft:crafting_table'}]
  write(BP/f'recipes/{p.relative_to(UP/f"data/{NS}/recipe")}',{'format_version':'1.20.10',typ.replace('crafting_','recipe_'):obj});crafts.append({'item':result,'java':d})
 elif typ!=NS+':bamboo_ferment':raise ValueError(typ)
# Fallback food items are namespaced here to avoid colliding with future Twilight/SMC ports.
for short in ['liangshan_ice_cone','kita_stuffed_crisp','pochi_pudding','magic_crispy_corner']:
 i=NS+':'+short;d=item(i,'food','kaleidoscope_twilight:'+short);c=d['minecraft:item']['components'];c['minecraft:food']={'nutrition':5,'saturation_modifier':.4,'can_always_eat':True};c['minecraft:use_animation']='eat';c['minecraft:use_modifiers']={'use_duration':1.6};c[NS+':food']={};write(BP/f'items/{short}.json',d)
# Paintings use Tavern's corrected wall/ceiling geometry and Java frames/textures.
for short in paintings:
 source=read(TAV/'runtime/BP/blocks/mona_lisa_painting.json');text=json.dumps(source).replace('kaleidoscope_tavern:mona_lisa_painting',NS+':'+short)
 # Actual placement and face transform handled by addon furniture router.
 d=json.loads(text);d['minecraft:block']['components'].pop(KT+':decoration',None)
 d['minecraft:block']['description']['menu_category']={'category':'none'}
 d['minecraft:block']['components'].pop('minecraft:item_visual',None)
 # Frames share Java's source texture layout; copy the matching original painting texture.
 candidates=[geo.resource_path(read(UP/f'assets/{KT}/models/item/{short}.json')['textures']['layer0'],'textures')]
 if not candidates:raise ValueError(('painting texture missing',short))
 src=candidates[0];dest=RP/f'textures/kwl/paintings/{short}.png';dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(src,dest);terrain['kwl_'+short]={'textures':str(dest.relative_to(RP).with_suffix(''))}
 for c in [d['minecraft:block']['components'],*(x['components'] for x in d['minecraft:block'].get('permutations',[]))]:
  for mat in c.get('minecraft:material_instances',{}).values():mat['texture']='kwl_'+short
  for key in list(c):
   if key.startswith(KT+':'):del c[key]
 d['minecraft:block']['components'][NS+':furniture']={};d['minecraft:block']['components']['minecraft:tick']={'interval_range':[20,20],'looping':True};write(BP/f'blocks/{short}.json',d)
 item(NS+':'+short,'block',KT+':'+short)
# Addon-owned cabinet displays support native Tavern bottles and addon bottles.
stock=read(TAV/'runtime/RP/entity/runtime_bar_cabinet_bottle_visual.entity.json')['minecraft:client_entity']['description']
viewgeo=list(stock['geometry'].values());viewtex=list(stock['textures'].values())
bases=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {STORAGE_BOTTLE_KINDS} from './runtime/BP/scripts/core/holder.js';console.log(JSON.stringify(STORAGE_BOTTLE_KINDS))"],cwd=TAV,text=True))
viewitems={KT+':'+b+(f'_q{q}' if b not in ['empty_bottle','molotov'] else ''):n for n,b in enumerate(bases) for q in (range(1,7) if b not in ['empty_bottle','molotov'] else [1])}
for base in bottleids:
 index=len(viewgeo);viewgeo.append(modelspec[base]['geometry']);viewtex.append(modelspec[base]['path'])
 for q in range(1,7):viewitems[base+f'_q{q}']=index
for mode in ['bar','cellar']:
 src=read(TAV/f'runtime/BP/entities/{"bar_cabinet" if mode=="bar" else "cellar_cabinet"}_bottle_visual.json');desc=src['minecraft:entity']['description'];desc['identifier']=NS+':cabinet_'+mode;desc['properties']={NS+':kind':{'type':'int','range':[0,len(viewgeo)-1],'default':0,'client_sync':True}};src['minecraft:entity']['components']['minecraft:type_family']={'family':['kwl_visual']};write(BP/f'entities/cabinet_{mode}.json',src)
 source=read(TAV/f'runtime/RP/entity/runtime_{"bar_cabinet" if mode=="bar" else "cellar_cabinet"}_bottle_visual.entity.json');desc=source['minecraft:client_entity']['description'];desc.update(identifier=NS+':cabinet_'+mode,geometry={f'kind_{n}':v for n,v in enumerate(viewgeo)},textures={f'kind_{n}':v for n,v in enumerate(viewtex)},materials={'default':'entity_alphatest_one_sided'},render_controllers=['controller.render.kwl.cabinet'])
 write(RP/f'entity/cabinet_{mode}.json',source)
write(RP/'render_controllers/cabinet.json',{'format_version':'1.8.0','render_controllers':{'controller.render.kwl.cabinet':{'arrays':{'geometries':{'Array.models':[f'Geometry.kind_{n}' for n in range(len(viewgeo))]},'textures':{'Array.textures':[f'Texture.kind_{n}' for n in range(len(viewtex))]}},'geometry':f"Array.models[q.property('{NS}:kind')]",'textures':[f"Array.textures[q.property('{NS}:kind')]"],'materials':[{'*':'Material.default'}]}}})
js(BP/'scripts/visual-items.js','VISUAL_ITEMS',viewitems)
js(BP/'scripts/compact-items.js','COMPACT_ITEMS',[i for i in viewitems if (i.split('_q')[0] not in [ident(x) for x in blocked]) and (not i.startswith(KT+':') or i.split(':')[1].split('_q')[0] in ['empty_bottle','molotov','champagne','glowflower_brew','honey_wine','ice_wine','luminous_bride','plum_wine','polaris_sweet_white','red_queen','sakura_wine','sauvignon_blanc_dry_white','sherry','vinegar','whiskey','wine'])])
seat=read(TAV/'runtime/BP/entities/seat_white.json');seat['minecraft:entity']['description']['identifier']=NS+':seat';seat['minecraft:entity']['components']['minecraft:type_family']={'family':['kwl_visual']};write(BP/'entities/seat.json',seat)
seat_client=read(TAV/'runtime/RP/entity/runtime_sofa_seat.entity.json');seat_client['minecraft:client_entity']['description']['identifier']=NS+':seat';write(RP/'entity/seat.json',seat_client)
# All custom sounds remain namespace-local.
sounddefs={}
for key,entry in read(UP/f'assets/{NS}/sounds.json').items():
 sounds=[]
 for value in entry['sounds']:
  value={'name':value} if isinstance(value,str) else value
  source=UP/f'assets/{NS}/sounds/{value["name"].split(":")[1]}.ogg';dst=RP/f'sounds/kwl/{source.name}';dst.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(source,dst)
  sounds.append({'name':str(dst.relative_to(RP).with_suffix('')),'stream':value.get('stream',False),'weight':value.get('weight',1)})
 sounddefs[NS+'.'+key]={'category':'record' if 'music_disc' in key else 'player','sounds':sounds}
write(RP/'sounds/sound_definitions.json',{'format_version':'1.14.0','sound_definitions':sounddefs})
record=item(NS+':custom_record','record');record['minecraft:item']['components'].update({'minecraft:max_stack_size':1});write(BP/'items/custom_record.json',record)
# Pin the SDK from the matching base release.
for file in ['tavern-extension-client.js','protocol.js','util.js']:
 dest=BP/'scripts/sdk'/file;dest.parent.mkdir(exist_ok=True);shutil.copyfile(TAV/'sdk'/file,dest)

# Each guide entry includes both acquisition and operation; no duplicate recipe pages.
usage={
 'bottle':{'en_US':'Brew in a Tavern barrel; extract with an empty bottle. Six quality stages. Drink, place, or store the bottle. Quality 4–6 can be poured into a shaker.','zh_CN':'在酒馆酒桶中酿造，用空酒瓶取出；共有六级品质。可饮用、摆放或存入酒架，佳酿及以上可倒入雪克杯。','zh_TW':'在酒館酒桶中釀造，用空酒瓶取出；共有六級品質。可飲用、擺放或存入酒架，佳釀及以上可倒入雪克杯。'},
 'cocktail':{'en_US':'Add the three listed ingredients to a Tavern shaker, hold to shake, then pour into empty glassware. Drink or place the finished glass.','zh_CN':'将配方的三份原料倒入雪克杯，按住摇匀，再用空玻璃杯接取；成品可饮用或摆放。','zh_TW':'將配方的三份原料倒入雪克杯，按住搖勻，再用空玻璃杯接取；成品可飲用或擺放。'},
 'freezer':{'en_US':'Sneak-use to open. Insert one bucket and ingredients in the listed order, then sneak-use to close. Freezing takes 90 seconds while loaded. Open and take one product at a time; pudding requires a bowl. Empty-hand use returns the last ingredient. A bucket drains the liquid.','zh_CN':'潜行使用开盖，加入一桶液体和按顺序放入原料，再潜行使用关盖。加载时冷冻 90 秒。开盖逐个取出成品；布丁需用碗接取。空手取回最后放入的原料；空桶可取回液体。','zh_TW':'潛行使用開蓋，加入一桶液體和按順序放入原料，再潛行使用關蓋。載入時冷凍 90 秒。開蓋逐個取出成品；布丁需用碗接取。空手取回最後放入的原料；空桶可取回液體。'},
 'cabinet':{'en_US':'Use a bottle on a slot to insert; empty hand takes it out. Cellar cabinets have nine slots and accept compact bottles; bar cabinets have two upright slots. Same-wood neighbors connect.','zh_CN':'手持酒瓶点击格子放入，空手取出。酒窖柜有九格，接受适合横放的酒瓶；吧台柜有两个直立格。同材质相邻自动连接。','zh_TW':'手持酒瓶點擊格子放入，空手取出。酒窖櫃有九格，接受適合橫放的酒瓶；吧台櫃有兩個直立格。同材質相鄰自動連接。'},
 'stool':{'en_US':'Place and use with an empty hand to sit. Sneak to dismount.','zh_CN':'摆放后空手点击坐下，潜行离开。','zh_TW':'擺放後空手點擊坐下，潛行離開。'},
 'painting':{'en_US':'Place on a wall, floor or ceiling.','zh_CN':'可贴墙、贴地或贴天花板放置。','zh_TW':'可貼牆、貼地或貼天花板放置。'},
 'drink':{'en_US':'Drink to receive the original 15-second effects; the glass bottle is returned. Can also be mixed in a shaker.','zh_CN':'饮用获得原版 15 秒效果，归还玻璃瓶；也可用于雪克杯调酒。','zh_TW':'飲用獲得原版 15 秒效果，歸還玻璃瓶；也可用於雪克杯調酒。'},
 'food':{'en_US':'Eat for 5 hunger points and 8-minute effects. Pudding returns a bowl. Bedrock has no native Luck status.','zh_CN':'食用恢复 5 点饥饿值，效果持续 8 分钟。布丁归还碗。基岩版没有原生幸运状态。','zh_TW':'食用恢復 5 點飢餓值，效果持續 8 分鐘。布丁歸還碗。基岩版沒有原生幸運狀態。'},
 'record':{'en_US':'Insert into a jukebox to play one of the two original tracks.','zh_CN':'放入唱片机，随机播放原版两首曲目之一。','zh_TW':'放入唱片機，隨機播放原版兩首曲目之一。'}}
# Local names are drawn from Java language data (including dependency names).
for i in [*bottleids,*(x for x in cocktailids if x.startswith(NS+':')),*(x for x in allitems if not re.search(r'_q[1-6]$',x) and x not in cocktailids)]:
 short=i.split(':')[1];kind='bottle' if i in bottleids else 'cocktail' if i in cocktailids else 'freezer' if short=='freezer' else 'cabinet' if 'cabinet' in short else 'stool' if 'bar_stool' in short else 'painting' if short.endswith('_painting') else 'drink' if short in ['cola','tonic_water'] else 'record' if short=='custom_record' else 'food'
 matching=[r for r in recipes if r['output'].get('item')==i or i+'_q1' in r['output'].get('byQuality',[])];craft=[c['java'] for c in crafts if c['item']==i];body={}
 for lc in langs:
  chunks=[usage[kind][lc]]
  for r in matching:
   parts=[' + '.join(name(x[0],lc) if x else '?' for x in r['ingredients'])]
   if r['kind']=='barrel':parts.insert(0,name(r['fluid'],lc));parts.append(name(r['carrier'],lc));
   else:parts.append(name(r['output']['item'],lc))
   chunks.append({'en_US':'Brewing','zh_CN':'酿造','zh_TW':'釀造'}[lc]+': '+' + '.join(parts)+' → '+name(i,lc))
  for c in craft:
   chunks.append({'en_US':'Crafting','zh_CN':'合成','zh_TW':'合成'}[lc]+':')
   if 'pattern' in c:
    chunks += [' / '.join(row.replace(' ','·') for row in c['pattern'])]
    chunks += [k+' = '+(name(ident(v['item']),lc) if 'item'in v else '#'+v['tag']) for k,v in c['key'].items()]
   else:chunks += [' + '.join(name(ident(v['item']),lc) if 'item'in v else '#'+v['tag'] for v in c['ingredients'])]
   chunks += ['→ '+name(i,lc)+' ×'+str(c['result'].get('count',1))]
  for r in freezers if short=='freezer' else [r for r in freezers if r['result']['id']==i]:
   chunks += [name(r['fluid'],lc)+' + '+(' + '.join(name(x[0],lc) for x in r['ingredients']) or '—')+' → '+name(r['result']['id'],lc)+' ×'+str(r['result'].get('count',1))+' (90s)']
  if i in effects:
   for q,rows in enumerate(effects[i],1):
    if not rows:continue
    chunks += [('Q'+str(q)+': ' if kind=='bottle' else '')+'; '.join(langs[lc].get('effect.'+x['effect'].replace(':','.'),x['effect'].split(':')[1].replace('_',' '))+' '+str(x['amplifier']+1)+' ('+str(x['duration'])+'s, '+str(round(x['probability']*100))+'%)' for x in rows)]
  if kind=='painting' and not craft:chunks += [{'en_US':'Obtained through the original painting crafting recipe, if available.','zh_CN':'通过原版对应画作的合成配方取得。','zh_TW':'透過原版對應畫作的合成配方取得。'}[lc]]
  body[lc]='\n\n'.join(chunks)
 iconid=i+'_q6' if kind=='bottle' else i
 pages.append({'id':NS+':guide/'+short,'title':localized(i),'body':body,'recipeIds':[r['id'] for r in matching],'icon':items_tex['kwl_'+iconid.split(':')[1]]['textures']})
# Native form/status labels, localized by the receiving client.
status={'inventory_full':('Inventory full','物品栏已满','物品欄已滿'),'remaining':('Freezing: %s s','冷冻剩余：%s 秒','冷凍剩餘：%s 秒'),'blocked':('The lid is blocked','上方被阻挡，无法开盖','上方被阻擋，無法開蓋'),'need_item':('Requires %s','需要 %s','需要 %s'),'now_playing':('Now playing: Bar Music Disc','正在播放：酒馆唱片','正在播放：酒館唱片')}
for lc,n in [('en_US',0),('zh_CN',1),('zh_TW',2)]:
 for key,values in status.items():texts[lc]['kwl.'+key]=values[n]

# The Java add-on hangs jukebox records on wall faces; 25 source models are pinned.
record_states=read(UP/f'assets/{NS}/blockstates/wall_record.json')['variants'];record_models={}
for state,definition in record_states.items():
 props=dict(x.split('=') for x in state.split(','))
 if props.get('facing')=='north':record_models[int(props['model_index'])]=model(definition['model'])
if set(record_models)!=set(range(25)):raise ValueError('Incomplete wall record source models')
first=record_models[0];wall=block(NS+':wall_record',first,'furniture',{KT+':facing':[0,1,2,3],NS+':model_group':list(range(5)),NS+':model_variant':list(range(5))})
wall=read(BP/'blocks/wall_record.json')
wall['minecraft:block']['components']['minecraft:transformation']={'rotation':[0,180,0]}
for perm in wall['minecraft:block']['permutations']:
 if 'minecraft:transformation' in perm['components']:
  old=perm['components']['minecraft:transformation']['rotation'][1]
  perm['components']['minecraft:transformation']['rotation'][1]=(old+180)%360
for n,mi in record_models.items():
 wall['minecraft:block']['permutations'].append({'condition':f"q.block_state('{NS}:model_group') == {n//5} && q.block_state('{NS}:model_variant') == {n%5}",'components':{'minecraft:geometry':{'identifier':mi['geometry']},'minecraft:material_instances':{'*':{'texture':mi['texture'],'render_method':'alpha_test_single_sided','face_dimming':False,'ambient_occlusion':0},'default':{'texture':mi['texture'],'render_method':'alpha_test_single_sided','face_dimming':False,'ambient_occlusion':0}}}})
wall['minecraft:block']['components']['minecraft:collision_box']={'origin':[-7,1,7],'size':[14,14,1]}
wall['minecraft:block']['components']['minecraft:selection_box']={'origin':[-7,1,7],'size':[14,14,1]}
write(BP/'blocks/wall_record.json',wall)
js(BP/'scripts/wall-record-models.js','RECORD_MODELS',{'minecraft:music_disc_'+s:n for n,s in enumerate(['13','cat','blocks','chirp','far','mall','mellohi','stal','strad','ward','11','wait','otherside','pigstep','5','relic','creator','precipice','creator_music_box'])})

# One curated creative entry per aged drink, in Tavern's existing family groups.
def group(group_name,icon,ids):return {'group_identifier':{'name':group_name,'icon':icon},'items':sorted(ids)}
wines=[i for i in allitems if i.endswith('_q6') or i in (NS+':cola',NS+':tonic_water')]
cocktails=[i for i in allitems if i in cocktailids]
decor=[i for i in allitems if i not in wines and i not in cocktails and not re.search(r'_q[1-5]$',i) and i.split(':')[1] not in ['liangshan_ice_cone','kita_stuffed_crisp','pochi_pudding','magic_crispy_corner']]
foods=[i for i in allitems if i.split(':')[1] in ['liangshan_ice_cone','kita_stuffed_crisp','pochi_pudding','magic_crispy_corner']]
write(BP/'item_catalog/crafting_item_catalog.json',{'format_version':'1.21.90','minecraft:crafting_items_catalog':{'categories':[{'category_name':'equipment','groups':[group(KT+':itemGroup.name.wines',NS+':absolut_vodka_q6',wines),group(KT+':itemGroup.name.cocktails',NS+':around_the_world',cocktails),group(KT+':itemGroup.name.tavern_decor',NS+':oak_bar_cabinet',decor),group('kaleidoscope_cookery:itemGroup.name.foods',NS+':pochi_pudding',foods)]}]}})

# Manifests: independent addon, required Tavern base; no player or HUD overrides.
u=lambda x:str(uuid.uuid5(uuid.NAMESPACE_URL,'https://github.com/casama233/kaleidoscope-world-liquor-unofficial/'+x))
for pack in ['BP','RP']:
 dep=[{'uuid':read(TAV/f'runtime/{pack}/manifest.json')['header']['uuid'],'version':TAV_VERSION}]
 mods=[{'type':'data' if pack=='BP' else 'resources','uuid':u(pack+'/module'),'version':VERSION}]
 if pack=='BP':mods.append({'type':'script','language':'javascript','entry':'scripts/main.js','uuid':u('script'),'version':VERSION});dep += [{'uuid':u('RP'),'version':VERSION},{'module_name':'@minecraft/server','version':'2.7.0'}]
 write(RT/pack/'manifest.json',{'format_version':2,'header':{'name':'pack.name','description':'pack.description','uuid':u(pack),'version':VERSION,'min_engine_version':[1,26,50]},'modules':mods,'dependencies':dep,**({'capabilities':['pbr']} if pack=='RP' else {})})
 write(RT/pack/'texts/languages.json',list(langs))
 for lc in langs:
  title={'en_US':'Kaleidoscope World Liquor (Unofficial)','zh_CN':'森罗酒馆：世界名酒（非官方）','zh_TW':'森羅酒館：世界名酒（非官方）'}[lc]
  desc={'en_US':'Unofficial Bedrock port. Requires Kaleidoscope Tavern (Unofficial). Public test build.','zh_CN':'世界名酒的非官方基岩版移植。需要森罗物语：酒馆（非官方）。公开测试版。','zh_TW':'世界名酒的非官方基岩版移植。需要森羅物語：酒館（非官方）。公開測試版。'}[lc]
  rows=texts[lc] if pack=='RP' else {};rows.update({'pack.name':title+' '+pack,'pack.description':desc,NS+':itemGroup.drinks':title,NS+':itemGroup.furniture':title+' — '+{'en_US':'Furniture','zh_CN':'家具','zh_TW':'家具'}[lc]})
  (RT/pack/f'texts/{lc}.lang').write_text('\n'.join(k+'='+v.replace('\n','\\n') for k,v in rows.items())+'\n')
  for itemid in allitems:
   if itemid.split(':')[1] in paintings:pass
 # Use the original gin bottle sprite as recognizable pack artwork.
 shutil.copyfile(RP/'textures/kwl/items/bombay_sapphire_gin_q6.png',RT/pack/'pack_icon.png')
write(BP/'loot_tables/empty.json',{'pools':[]})
js(BP/'scripts/freezer-recipes.js','FREEZER_RECIPES',freezers)
js(BP/'scripts/content.js','CONTENT',content)
js(BP/'scripts/payload.js','payload',{'api':1,'source':NS,'version':'0.1.4','title':{'en_US':'World Liquor','zh_CN':'世界名酒','zh_TW':'世界名酒'},'recipes':recipes,'shakerInputs':inputs,'content':content,'pages':pages})
write(RP/'textures/item_texture.json',{'resource_pack_name':'World Liquor','texture_name':'atlas.items','texture_data':items_tex})
write(RP/'textures/terrain_texture.json',{'resource_pack_name':'World Liquor','texture_name':'atlas.terrain','texture_data':terrain})
write(ROOT/'docs/conversion-audit.json',audit)
print('Recipes',len(recipes),'freezer',len(freezers),'crafting',len(crafts),'shaker inputs',len(inputs))

# Always replace legacy prose with guide pages derived from the final runtime tables.
import rebuild_guide
rebuild_guide.main()
