#!/usr/bin/env python3
"""Inspect native damage-source, kill and loot capabilities on native mobs in a NEW isolated QA world.
No simulated players; not family admission or human-client evidence.
"""
from pathlib import Path
import argparse,json,os,shutil,subprocess,time,uuid
ROOT=Path(__file__).resolve().parents[1]
def main():
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--bds-root',type=Path,required=True);parser.add_argument('--output',type=Path,required=True);parser.add_argument('--port',type=int,default=26942);parser.add_argument('--execute',action='store_true');args=parser.parse_args()
 base=args.bds_root.resolve();out=args.output.resolve();assert not out.exists(),'Keep previous evidence; choose a new directory'
 assert not out.is_relative_to(base),'QA must be outside the BDS/live root'
 props=dict(line.split('=',1) for line in (base/'server.properties').read_text().splitlines() if '=' in line and not line.lstrip().startswith('#'))
 assert not {args.port,args.port+1}&{int(props.get('server-port','19132')),int(props.get('server-portv6','19133'))},'Port overlaps live'
 if not args.execute:print(json.dumps({'execute':False,'isolated_output':str(out),'players':0,'client':False}));return
 out.mkdir()
 for name in ['bedrock_server','definitions','behavior_packs','resource_packs']:(out/name).symlink_to(base/name,target_is_directory=(base/name).is_dir())
 for name in ['config','minecraftpe','treatments']:shutil.copytree(base/name,out/name)
 (out/'allowlist.json').write_text('[]\n');(out/'server.properties').write_text(f'server-name=Native treasure-block capability QA\nlevel-name=treasure-block-qa\nlevel-type=FLAT\nserver-port={args.port}\nserver-portv6={args.port+1}\nonline-mode=true\nallow-list=true\nview-distance=4\ntick-distance=4\nmax-threads=2\ndifficulty=normal\nenable-lan-visibility=false\ncontent-log-file-enabled=true\ncontent-log-console-output-enabled=true\ntransport=nethernet\n')
 world=out/'worlds/treasure-block-qa';pack=world/'behavior_packs/treasure-block-qa';(pack/'scripts').mkdir(parents=True);(pack/'entities').mkdir();uid=str(uuid.uuid4())
 manifest={'format_version':2,'header':{'name':'Native treasure-block capability QA only','description':'No simulated players or live writes; not a release.','uuid':uid,'version':[0,0,1],'min_engine_version':[1,26,20]},'modules':[{'type':'data','uuid':str(uuid.uuid4()),'version':[0,0,1]},{'type':'script','language':'javascript','entry':'scripts/main.js','uuid':str(uuid.uuid4()),'version':[0,0,1]}],'dependencies':[{'module_name':'@minecraft/server','version':'2.7.0'}]}
 (pack/'manifest.json').write_text(json.dumps(manifest,indent=2));(world/'world_behavior_packs.json').write_text(json.dumps([{'pack_id':uid,'version':[0,0,1]}]));(world/'world_resource_packs.json').write_text('[]')
 (pack/'blocks').mkdir();(pack/'loot_tables/blocks').mkdir(parents=True)
 for name,tag in [('plain','c:ores'),('plant','kaleidoscope_world_liquor:crop_block')]:
  block={'format_version':'1.26.20','minecraft:block':{'description':{'identifier':'treasure_fixture:'+name},'components':{'minecraft:geometry':'geometry.full_block','minecraft:material_instances':{'*':{'texture':'stone','render_method':'opaque'}},'minecraft:loot':'loot_tables/blocks/'+name+'.json','minecraft:tags':[tag]}}}
  (pack/'blocks'/f'{name}.json').write_text(json.dumps(block));(pack/'loot_tables/blocks'/f'{name}.json').write_text(json.dumps({'pools':[{'rolls':1,'entries':[{'type':'item','name':'minecraft:iron_ingot'}]}]}))
 shutil.copy2(ROOT/'tests/native/treasure-block-probe.js',pack/'scripts/main.js');shutil.copy2(ROOT/'runtime/BP/scripts/treasure-block.js',pack/'scripts/treasure-block.js')
 log=out/'native.log'
 with log.open('w') as output:
  process=subprocess.Popen(['./bedrock_server'],cwd=out,env={**os.environ,'LD_LIBRARY_PATH':str(out)},stdin=subprocess.PIPE,stdout=output,stderr=subprocess.STDOUT,text=True)
  try:
   for _ in range(60):
    time.sleep(1);text=log.read_text(errors='replace')
    if process.poll() is not None or '"kind":"done"' in text or '"kind":"failure"' in text or ' ERROR]' in text:break
   if process.poll() is None:process.communicate('stop\n',timeout=30)
  finally:
   if process.poll() is None:process.kill();process.wait()
 text=log.read_text(errors='replace');rows=[json.loads(line.split('[TREASURE_BLOCK_QA] ',1)[1]) for line in text.splitlines() if '[TREASURE_BLOCK_QA] ' in line]
 cases=[row for row in rows if row['kind']=='case']
 expected={'ore-below-threshold','ore-between-old-and-source-threshold','immature-crop','source-noncrop','netherite-source-tag','external-tagged-ore','external-crop-class','silk-touch-original-tool'}
 actual={row['mode'] for row in cases}
 ok=process.returncode==0 and ' ERROR]' not in text and 'Player connected:' not in text and any(row['kind']=='done' and row['players']==0 for row in rows) and actual==expected and not any(row['kind']=='failure' for row in rows)
 report={'test_only':True,'ok':ok,'simulated_players':False,'client':False,'cases':sorted(actual),'items':[row for row in rows if row['kind']=='items'],'samples':cases,'exit_code':process.returncode,'log':str(log),'scope':'Production block-extra loot helper with real native permutations/tools/item emission. No simulated players or actual player-break/client acceptance.'}
 (out/'native-treasure-block-report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({k:v for k,v in report.items() if k not in ['samples']}));assert ok,'Native treasure-block capability probe failed; keep its output for review'
if __name__=='__main__':main()
