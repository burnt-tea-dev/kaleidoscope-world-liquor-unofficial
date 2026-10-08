"""Affected native storage proof with only canonical Tavern/World Liquor.

This tests public-only operation while unrelated live drift is reviewed. It is
not family admission, installation, saved-live migration or client acceptance.
"""
from pathlib import Path
import argparse,json,shutil,subprocess,sys
def read(p):return json.loads(Path(p).read_text())
def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--family-config',type=Path,required=True);p.add_argument('--source',type=Path,required=True);p.add_argument('--output',type=Path,required=True);p.add_argument('--port',type=int,required=True);a=p.parse_args();config=read(a.family_config);source=a.source.resolve();out=a.output.resolve();assert not out.exists()
 sys.path.insert(0,str(Path(config['sources']['tavern'])/'tools'))
 from family_update import common
 common.configure(a.family_config)
 from family_update import native_common
 from family_update.freezer_storage_preservation import inspect_world
 from family_update.storage import require_space
 require_space(Path(config['output_dir']),'Standalone freezer input experiment',512*1024*1024);inputs=common.engine_inputs();native_common.setup_engine(out,'Standalone Freezer QA',a.port,expected_inputs=inputs)
 world=out/'worlds/Standalone Freezer QA';world.mkdir(parents=True);refs={'behavior':[],'resource':[]};proof={}
 for name,root in [('tavern',Path(config['sources']['tavern'])),('world-liquor',source)]:
  baseline=read(root/'baseline.json');commit=subprocess.check_output(['git','-C',str(root),'rev-parse','HEAD'],text=True).strip();proof[name]={'commit':commit,'version':baseline['version'],'source_trees':baseline['source_trees']}
  for side,short in [('behavior','BP'),('resource','RP')]:
   uuid=baseline['packs'][short]['uuid'];shutil.copytree(root/baseline['runtime'][short],world/(side+'_packs')/uuid);refs[side].append({'pack_id':uuid,'version':baseline['version']})
 for side,rows in refs.items():(world/('world_'+side+'_packs.json')).write_text(json.dumps(rows,indent=2)+'\n')
 native_common.blank_level(world,'Standalone Freezer QA');uuid=read(source/'baseline.json')['packs']['BP']['uuid'];pack=world/'behavior_packs'/uuid;target=pack/'scripts/qa-freezer-storage-probe.js';shutil.copy2(source/'tests/native/freezer-storage-probe.js',target);main=pack/'scripts/main.js';original=main.read_bytes();main.write_bytes(original+b"\nimport './qa-freezer-storage-probe.js';\n")
 setup={'scope':'Only canonical public Tavern and World Liquor; no private integration or third-party configured world packs','sources':proof,'engine_inputs':inputs,'world_pack_count':4,'test_only_overlays':['Owned World Liquor observer import','qa-freezer-storage-probe.js'],'client':False,'simulated_players':False,'live_mutated':False,'family_admission':False};(out/'setup.json').write_text(json.dumps(setup,indent=2)+'\n')
 native_common.STARTUP_MARKERS=['Server started.','Registered kaleidoscope_world_liquor'];runs=[];rows=[];inventories=[]
 for phase in ['first','restart']:
  run=native_common.native_run(out,phase,minimum_seconds=35);runs.append(run);body=(out/(phase+'.log')).read_text(errors='replace');items=[json.loads(line.split('[FREEZER_STORAGE_QA] ',1)[1])for line in body.splitlines()if '[FREEZER_STORAGE_QA] 'in line];rows.extend(items);good=run['ok']and any(r.get('kind')=='done'and r.get('phase')==phase for r in items)and not any(r.get('kind')=='failure'for r in items);print(json.dumps({'phase':phase,'ok':good,'errors':run['errors'],'rows':items}),flush=True)
  if not good:break
  inventories.append(inspect_world(world,uuid))
 ok=len(runs)==2 and all(r['ok']for r in runs)and len(inventories)==2 and len(inventories[0])==1 and inventories[0]==inventories[1]and not any(r.get('kind')=='failure'for r in rows)
 if ok:main.write_bytes(original);target.unlink()
 report={**setup,'ok':ok,'runs':runs,'rows':rows,'complete_native_inventory_nbt':inventories};(out/'report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'ok':ok,'report':str(out/'report.json')}),flush=True);return 0 if ok else 1
if __name__=='__main__':raise SystemExit(main())
