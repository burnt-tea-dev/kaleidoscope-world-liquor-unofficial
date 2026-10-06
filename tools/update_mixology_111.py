#!/usr/bin/env python3
"""Adapt only current Java mixology data/assets; retain all other repairs."""
import argparse,json,hashlib,math,sys
from pathlib import Path
import zipfile
import java_geometry as geo

ROOT=Path(__file__).resolve().parents[1]
NS='kaleidoscope_world_liquor';KT='kaleidoscope_tavern'
def write(path,data):
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--jar',type=Path,required=True);args=parser.parse_args()
    ref=ROOT/'data/java-parity/neoforge-1.1.11'
    with zipfile.ZipFile(args.jar) as archive:
        names=[n for n in archive.namelist() if '/recipe/shaker/' in n and n.endswith('.json')]
        assert len(names)==18
        tags={Path(n).stem:json.loads(archive.read(n)) for n in archive.namelist() if '/tags/item/cocktail_ingredient_' in n}
        recipes={Path(n).stem:json.loads(archive.read(n)) for n in names}
        assets=[n for n in archive.namelist() if n.startswith('assets/'+NS+'/') and ('highball' in n or '/lang/' in n) and n.endswith(('.json','.png'))]
        for name in assets:
            path=ROOT/'upstream'/name;path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(archive.read(name))
        effects=json.loads(archive.read('data/'+NS+'/datamap/drink_effect/highball.json'))
    colors=[{'tag':KT+':cocktail_ingredient_'+name,'color':rgb,'priority':104-i,'translationKey':'color.'+KT+'.'+name} for i,(name,rgb) in enumerate([('brown',8606770),('orange',16351261),('light_blue',3847130),('pink',15961002)])]
    labels={'brown':{'en_US':'Brown','zh_CN':'棕色','zh_TW':'棕色'},'orange':{'en_US':'Orange','zh_CN':'橙色','zh_TW':'橙色'},'light_blue':{'en_US':'Light Blue','zh_CN':'浅蓝色','zh_TW':'淺藍色'},'pink':{'en_US':'Pink','zh_CN':'粉色','zh_TW':'粉色'}}
    for color in colors:color['labels']=labels[color['tag'].split('cocktail_ingredient_')[1]]
    write(ref/'reference.json',{'project_id':1502365,'file_id':9066406,'version':'1.1.11','loader':'NeoForge','minecraft':'1.21.1','archive_sha256':hashlib.sha256(args.jar.read_bytes()).hexdigest(),'color_source':'ModCocktailColors.EXTRA_COLORS bytecode; exact source ordering','colors':colors,'source_aliases':{'smc:ice_tea':NS+':ice_tea'},'shaker_recipes':recipes,'item_tags':tags,'highball_effects':effects})
    for stale in (ROOT/'upstream/data'/NS/'recipe/shaker').glob('*.json'):stale.unlink()
    for name,data in recipes.items():
        write(ref/'shaker'/f'{name}.json',data);write(ROOT/'upstream/data'/NS/'recipe/shaker'/f'{name}.json',data)
    for stale in (ROOT/'upstream/data'/KT/'tags/item').glob('cocktail_ingredient_*.json'):stale.unlink()
    for name,data in tags.items():
        write(ref/'cocktail-tags'/f'{name}.json',data);write(ROOT/'upstream/data'/KT/'tags/item'/f'{name}.json',data)
    path=ROOT/'runtime/BP/scripts/payload.js';payload=json.loads(path.read_text().split('=',1)[1].strip().rstrip(';'))
    payload['requires']=list(dict.fromkeys([*payload.get('requires',[]),'shaker_color_catalog','java_ingredient_predicates','automatic_bottle_inputs']))
    payload['shakerColors']=colors
    bottles={row['base']:row['items'] for row in payload['content'] if row['kind']=='bottle'}
    # The maintained host exposes physical quality IDs; source base tag values
    # expand to those actual IDs, with the historical smc rename kept explicit.
    tavern=Path(__import__('os').environ.get('TAVERN_ROOT',str(ROOT.parent/'tavern-src')))
    import subprocess
    core=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {BOTTLES} from './runtime/BP/scripts/data/bottles.js';console.log(JSON.stringify(BOTTLES))"],cwd=tavern,text=True))
    for base in core:bottles[KT+':'+base]=core[base].get('items') or [KT+':'+base+'_q'+str(q) for q in range(1,7)]
    def ids(item):
        item=NS+':ice_tea' if item=='smc:ice_tea' else item
        return bottles.get(item,[item])
    changes={}
    for name,data in tags.items():
        tag=KT+':'+name
        for operation,values in [('add',data.get('values',[])),('remove',data.get('remove',[]))]:
            for value in values:
                for item in ids(value if isinstance(value,str) else value['id']):
                    change=changes.setdefault(item,{'item':item,'add':[],'remove':[]});change[operation].append(tag)
    payload['itemTagChanges']=list(changes.values())
    core_colors={'black':0,'dark_blue':170,'dark_green':43520,'dark_aqua':43690,'dark_red':11141120,'dark_purple':11141290,'gold':16755200,'gray':11184810,'dark_gray':5592405,'blue':5592575,'green':5635925,'aqua':5636095,'red':16733525,'light_purple':16733695,'yellow':16777045,'white':16777215}
    all_colors={**{KT+':cocktail_ingredient_'+name:rgb for name,rgb in core_colors.items()},**{row['tag']:row['color'] for row in colors}}
    for input in payload['shakerInputs']:
        category=changes.get(input['item'],{}).get('add',[])
        input['ingredientTags']=category
        input['color']=next((all_colors[tag] for tag in category if tag in all_colors),0xffffff)
    for content in payload['content']:
        if content['kind']=='bottle':
            category=changes.get(content['items'][3],{}).get('add',[])
            if category:content['color']=category[0]
    for item,change in changes.items():
        if item.startswith(NS+':') and (bp_item:=ROOT/'runtime/BP/items'/f"{item.split(':')[1]}.json").exists():
            definition=json.loads(bp_item.read_text());definition['minecraft:item']['components']['minecraft:tags']={'tags':change['add']};write(bp_item,definition)
    payload['recipes']=[r for r in payload['recipes'] if r['kind']!='shaker']
    for name,row in sorted(recipes.items()):
        payload['recipes'].append({'id':NS+':shaker/'+name,'kind':'shaker','ingredients':row['ingredients'],'output':{'item':row['result'].get('id',row['result'].get('item'))}})
    for page in payload['pages']:
        if page.get('item')==NS+':highball':page['id']=NS+':guide/highball';page['icon']='textures/kwl/items/highball'
    known={recipe['id'] for recipe in payload['recipes']}
    for page in payload['pages']:page['recipeIds']=[recipe for recipe in page.get('recipeIds',[]) if recipe in known]
    if not any(page.get('item')==NS+':highball' for page in payload['pages']):
        payload['pages'].append({'id':NS+':guide/highball','item':NS+':highball','icon':'textures/kwl/items/highball','category':'cocktail','title':{'en_US':'Highball','zh_CN':'嗨棒','zh_TW':'嗨棒'},'body':{'en_US':'Shaker cocktail. Java flight ability is not implemented on the stable Bedrock platform.','zh_CN':'雪克杯鸡尾酒。Java 创造飞行能力目前未在基岩稳定版实现。','zh_TW':'雪克杯雞尾酒。Java 創造飛行能力目前未在基岩穩定版實現。'},'recipeIds':[NS+':shaker/highball',NS+':shaker/highball1']})
    # Reuse the existing native cup contract but convert the actual new authored
    # geometry/UVs; never alias Highball to an unrelated historical model.
    rp=ROOT/'runtime/RP';bp=ROOT/'runtime/BP'
    model=geo.resolve_model(NS+':block/mixology/highball')
    for element in model.get('elements',[]):
        rotation=element.get('rotation',{})
        if rotation.get('rescale'):
            scale=1/math.cos(math.radians(rotation['angle']));axis='xyz'.index(rotation['axis']);pivot=rotation['origin']
            for edge in ['from','to']:element[edge]=[value if index==axis else pivot[index]+(value-pivot[index])*scale for index,value in enumerate(element[edge])]
            rotation['rescale']=False
    model,_=geo.lower_mixed_axis_surfaces(model);model,_=geo.lower_uv_half_turns(model,allow_quarter_turns=True)
    atlas=rp/'textures/kwl/generated/kaleidoscope_world_liquor__block__mixology__highball.png'
    placement=geo.build_atlas(model,atlas)
    geometry=geo.geometry(model,'mixology_highball',placement,[[0,0]],allow_native_uv_rotation=True)
    geometry['minecraft:geometry'][0]['description']['identifier']='geometry.kwl.highball_111'
    for bone in geometry['minecraft:geometry'][0]['bones']:
        for cube in bone.get('cubes',[]):
            for face in cube['uv'].values():face['material_instance']='default'
    sys.path.insert(0,str(tavern/'tools'))
    from repair_drink_planes import repair_geometry
    repair_geometry(geometry)
    write(rp/'models/entity/kwl_highball_111.geo.json',geometry)
    block=json.loads((bp/'blocks/cup_gin_tonic.json').read_text())
    block=json.loads(json.dumps(block).replace('cup_gin_tonic','cup_highball'))
    components=block['minecraft:block']['components'];components['minecraft:geometry']['identifier']='geometry.kwl.highball_111'
    texture='kwl_kaleidoscope_world_liquor__block__mixology__highball'
    for material in components['minecraft:material_instances'].values():material['texture']=texture
    write(bp/'blocks/cup_highball.json',block)
    item=json.loads((bp/'items/gin_tonic.json').read_text());item=json.loads(json.dumps(item).replace('gin_tonic','highball'));write(bp/'items/highball.json',item)
    import shutil
    icon=rp/'textures/kwl/items/highball.png';icon.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(ROOT/'upstream/assets'/NS/'textures/item/highball.png',icon)
    for filename,key,value in [('textures/item_texture.json','kwl_highball',{'textures':'textures/kwl/items/highball'}),('textures/terrain_texture.json',texture,{'textures':atlas.relative_to(rp).with_suffix('').as_posix()})]:
        target=rp/filename;data=json.loads(target.read_text());data['texture_data'][key]=value;write(target,data)
    if not any(row.get('item')==NS+':highball' for row in payload['content']):payload['content'].append({'kind':'cocktail','item':NS+':highball','block':NS+':cup_highball','effects':effects['effects'][0]})
    path.write_text('export const payload = '+json.dumps(payload,ensure_ascii=False,indent=2)+';\n')
    # New reviewed terms need only the explicit simplified/traditional pair.
    convert=lambda value:value.replace('浅','淺')
    for locale in ['en_US','zh_CN','zh_TW']:
        source=json.loads((ROOT/'upstream/assets'/NS/'lang'/('zh_cn.json' if locale=='zh_TW' else locale.lower()+'.json')).read_text())
        label=source.get('item.'+NS+'.highball',source.get('block.'+NS+'.highball','Highball'))
        if locale=='zh_TW':label=convert(label)
        path=rp/'texts'/f'{locale}.lang';rows=path.read_text().splitlines();updates={'item.'+NS+':highball.name':label,'tile.'+NS+':cup_highball.name':label}
        for name,_ in [('brown',0),('orange',0),('light_blue',0),('pink',0)]:
            key='color.'+KT+'.'+name;value=source.get(key,{'brown':('Brown','棕色'),'orange':('Orange','橙色'),'light_blue':('Light Blue','浅蓝色'),'pink':('Pink','粉色')}[name][0 if locale=='en_US' else 1]);updates[key]=convert(value) if locale=='zh_TW' else value
        rows=[row for row in rows if row.split('=',1)[0] not in updates];path.write_text('\n'.join(rows)+ '\n'+'\n'.join(key+'='+value for key,value in updates.items())+'\n')
    print('Adapted all 18 current source recipes, 4 extended colours, tag reclassification and Highball assets')
if __name__=='__main__':main()
