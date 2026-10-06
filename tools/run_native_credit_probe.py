#!/usr/bin/env python3
"""Run canonical credit callbacks on native mobs in a NEW isolated QA world.
No simulated players; not family admission or human-client evidence.
"""
from pathlib import Path
import argparse,json,os,shutil,subprocess,time,uuid
ROOT=Path(__file__).resolve().parents[1]
def main():
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--bds-root',type=Path,required=True);parser.add_argument('--output',type=Path,required=True);parser.add_argument('--port',type=int,default=26760);parser.add_argument('--execute',action='store_true');args=parser.parse_args()
 base=args.bds_root.resolve();out=args.output.resolve();assert not out.exists(),'Keep previous evidence; choose a new directory'
 assert not out.is_relative_to(base),'QA must be outside the BDS/live root'
 props=dict(line.split('=',1) for line in (base/'server.properties').read_text().splitlines() if '=' in line and not line.lstrip().startswith('#'))
 assert not {args.port,args.port+1}&{int(props.get('server-port','19132')),int(props.get('server-portv6','19133'))},'Port overlaps live'
 if not args.execute:print(json.dumps({'execute':False,'isolated_output':str(out),'players':0,'client':False}));return
 out.mkdir()
 for name in ['bedrock_server','definitions','behavior_packs','resource_packs']:(out/name).symlink_to(base/name,target_is_directory=(base/name).is_dir())
 for name in ['config','minecraftpe','treatments']:shutil.copytree(base/name,out/name)
 (out/'allowlist.json').write_text('[]\n');(out/'server.properties').write_text(f'server-name=Native credit QA\nlevel-name=credit-qa\nlevel-type=FLAT\nserver-port={args.port}\nserver-portv6={args.port+1}\nonline-mode=true\nallow-list=true\nview-distance=4\ntick-distance=4\nmax-threads=2\ndifficulty=normal\nenable-lan-visibility=false\ncontent-log-file-enabled=true\ncontent-log-console-output-enabled=true\ntransport=nethernet\n')
 world=out/'worlds/credit-qa';pack=world/'behavior_packs/credit-qa';(pack/'scripts').mkdir(parents=True);(pack/'entities').mkdir();uid=str(uuid.uuid4())
 manifest={'format_version':2,'header':{'name':'Native credit QA only','description':'No simulated players or live writes; not a release.','uuid':uid,'version':[0,0,1],'min_engine_version':[1,26,20]},'modules':[{'type':'data','uuid':str(uuid.uuid4()),'version':[0,0,1]},{'type':'script','language':'javascript','entry':'scripts/main.js','uuid':str(uuid.uuid4()),'version':[0,0,1]}],'dependencies':[{'module_name':'@minecraft/server','version':'2.7.0'}]}
 (pack/'manifest.json').write_text(json.dumps(manifest,indent=2));(world/'world_behavior_packs.json').write_text(json.dumps([{'pack_id':uid,'version':[0,0,1]}]));(world/'world_resource_packs.json').write_text('[]')
 shutil.copy2(ROOT/'tests/native/credit-probe-entity.json',pack/'entities/probe.json');shutil.copy2(ROOT/'tests/native/kill-credit-probe.js',pack/'scripts/main.js')
 for name in ['effects.js','combat-source.js','kill-credit.js','motion-source.js','liquid-contact.js','sdk/tavern-effects.js','sdk/tavern-foundation-client.js','sdk/protocol.js','sdk/util.js']:
  target=pack/'scripts'/name;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(ROOT/'runtime/BP/scripts'/name,target)
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
 text=log.read_text(errors='replace');rows=[json.loads(line.split('[COMBAT_QA] ',1)[1]) for line in text.splitlines() if '[COMBAT_QA] ' in line]
 expected={'spaced-fresh-A':4,'spaced-environment-after-A':8,'spaced-B-after-A':8,'spaced-environment-after-B':4,'canceled-A':0,'B-after-canceled-A':4,'environment-after-expiry':4}
 actual={row['label']:row['damage'] for row in rows if row['kind']=='productionDamage'}
 ok=process.returncode==0 and ' ERROR]' not in text and 'Player connected:' not in text and any(row['kind']=='done' and row['players']==0 for row in rows) and all(actual.get(key)==value for key,value in expected.items())
 report={'test_only':True,'ok':ok,'simulated_players':False,'client':False,'cases':actual,'expected_spaced_and_cancel_cases':expected,'exit_code':process.returncode,'log':str(log),'scope':'Actual native mobs, controlled SDK effect provision; callback/credit only, not client or full parity.'}
 (out/'native-credit-report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report));assert ok,'Native credit probe failed; keep its output for review'
if __name__=='__main__':main()
