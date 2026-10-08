#!/usr/bin/env python3
"""Source scheduler with real native blocks/properties and an actual stopped restart.
No simulated players. This affected-path probe is not complete family admission.
"""
from pathlib import Path
import argparse,json,os,shutil,subprocess,time,uuid
ROOT=Path(__file__).resolve().parents[1]
def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--bds-root',type=Path,required=True);p.add_argument('--output',type=Path,required=True);p.add_argument('--port',type=int,default=27802);p.add_argument('--execute',action='store_true');a=p.parse_args()
 base=a.bds_root.resolve();out=a.output.resolve();assert not out.exists() and not out.is_relative_to(base)
 props=dict(x.split('=',1) for x in (base/'server.properties').read_text().splitlines()if '='in x and not x.lstrip().startswith('#'));assert not {a.port,a.port+1}&{int(props.get('server-port',19132)),int(props.get('server-portv6',19133))}
 if not a.execute:print(json.dumps({'execute':False,'output':str(out),'players':0,'client':False}));return
 out.mkdir()
 for n in ['bedrock_server','definitions','behavior_packs','resource_packs']:(out/n).symlink_to(base/n,target_is_directory=(base/n).is_dir())
 for n in ['config','minecraftpe','treatments']:shutil.copytree(base/n,out/n)
 (out/'allowlist.json').write_text('[]\n');(out/'server.properties').write_text(f'level-name=aging-qa\nlevel-type=FLAT\nserver-port={a.port}\nserver-portv6={a.port+1}\nonline-mode=true\nallow-list=true\nview-distance=4\ntick-distance=4\nmax-threads=2\nenable-lan-visibility=false\ncontent-log-file-enabled=true\ncontent-log-console-output-enabled=true\ntransport=nethernet\n')
 world=out/'worlds/aging-qa';pack=world/'behavior_packs/aging-qa';(pack/'scripts').mkdir(parents=True);(pack/'entities').mkdir();uid=str(uuid.uuid4())
 manifest={'format_version':2,'header':{'name':'Native frost aging QA','description':'Discardable observer, not runtime','uuid':uid,'version':[0,0,1],'min_engine_version':[1,26,50]},'modules':[{'type':'data','uuid':str(uuid.uuid4()),'version':[0,0,1]},{'type':'script','language':'javascript','entry':'scripts/main.js','uuid':str(uuid.uuid4()),'version':[0,0,1]}],'dependencies':[{'module_name':'@minecraft/server','version':'2.7.0'}]}
 (pack/'manifest.json').write_text(json.dumps(manifest));(world/'world_behavior_packs.json').write_text(json.dumps([{'pack_id':uid,'version':[0,0,1]}]));(world/'world_resource_packs.json').write_text('[]')
 shutil.copy2(ROOT/'tests/native/frost-probe-entity.json',pack/'entities/probe.json');shutil.copy2(ROOT/'tests/native/frost-aging-probe.js',pack/'scripts/main.js')
 for n in ['frost-water.js','frost-aging.js']:shutil.copy2(ROOT/'runtime/BP/scripts'/n,pack/'scripts'/n)
 runs=[]
 for phase in ['first','restart']:
  log=out/(phase+'.log')
  with log.open('w')as output:
   proc=subprocess.Popen(['./bedrock_server'],cwd=out,env={**os.environ,'LD_LIBRARY_PATH':str(out)},stdin=subprocess.PIPE,stdout=output,stderr=subprocess.STDOUT,text=True)
   try:
    for _ in range(70):
     time.sleep(1);text=log.read_text(errors='replace')
     if proc.poll()is not None or '"kind":"done"'in text or '"kind":"failure"'in text or ' ERROR]'in text:break
    if proc.poll()is None:proc.communicate('stop\n',timeout=30)
   finally:
    if proc.poll()is None:proc.kill();proc.wait()
  text=log.read_text(errors='replace');rows=[json.loads(x.split('[FROST_AGING_QA] ',1)[1])for x in text.splitlines()if '[FROST_AGING_QA] 'in x];cases=[x for x in rows if x['kind']=='case'];errors=[x for x in text.splitlines()if ' ERROR]'in x or '[error]'in x.lower()];ok=proc.returncode==0 and not errors and 'Player connected:'not in text and any(x['kind']=='done'and x['phase']==phase and x['players']==0 for x in rows)and not any(x['kind']=='failure'for x in rows)
  run={'phase':phase,'ok':ok,'exit_code':proc.returncode,'errors':errors,'cases':cases,'log':str(log)};runs.append(run);print(json.dumps(run),flush=True)
  if not ok:break
 expected={'saved-half-delay','first-age-after-restart','age-2','age-3','melt','night-deferred','time-command-isolated','neighbor-removal','production-enrollment'};actual={c['name']for r in runs for c in r['cases']};ok=len(runs)==2 and all(r['ok']for r in runs)and actual==expected
 report={'test_world_only':True,'ok':ok,'runs':runs,'simulated_players':False,'client':False,'scope':'Native deterministic scheduled aging, source selection enrollment, dynamic-property queue persistence and stopped restart; no complete Java random-tick/neighbor-event/unloaded-chunk/client acceptance.'};(out/'report.json').write_text(json.dumps(report,indent=2)+'\n');assert ok,'Frost aging native probe failed; preserve output'
if __name__=='__main__':main()
