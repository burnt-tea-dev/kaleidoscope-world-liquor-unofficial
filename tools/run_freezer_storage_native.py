"""Real native four-slot ItemStack/restart experiment; no simulated players.

Declared observer import runs in the owned World Liquor BP so its dynamic
property ownership is real. This disposable world is never admission input.
"""
from pathlib import Path
import argparse,json,shutil,subprocess,sys

def read(p):return json.loads(Path(p).read_text())
def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--family-config',type=Path,required=True);p.add_argument('--source',type=Path,required=True);p.add_argument('--output',type=Path,required=True);p.add_argument('--port',type=int,required=True);a=p.parse_args()
 config=read(a.family_config);context=Path(config['output_dir']);source=a.source.resolve();out=a.output.resolve();assert not out.exists() and not out.is_relative_to(source)
 sys.path.insert(0,str(Path(config['sources']['tavern'])/'tools'))
 from family_update import common
 from family_update.storage import require_space,allocated
 common.configure(a.family_config)
 from family_update import native_common
 candidate=context/'release-candidate';receipt=read(candidate/'family-receipt.json');native_common.audit_candidate(candidate,receipt)
 inputs=common.engine_inputs();prior=read(context/'exact-engine/native-report.json');assert prior['bds'] and prior['engine_inputs']==inputs
 require_space(context,'Native freezer input persistence',allocated(candidate));native_common.setup_engine(out,'Freezer Input QA',a.port,expected_inputs=inputs)
 world=out/'worlds/Freezer Input QA';world.parent.mkdir();shutil.copytree(candidate,world);native_common.blank_level(world,'Freezer Input QA');native_common.audit_candidate(world,receipt)
 pack=world/'behavior_packs'/read(source/'baseline.json')['packs']['BP']['uuid'];affected=['furniture.js','freezer-storage.js','freezer-native-storage.js','freezer-input.js','freezer-milk.js','captured-item.js']
 for name in affected:assert (source/'runtime/BP/scripts'/name).read_bytes()==(pack/'scripts'/name).read_bytes(),'Affected source differs from candidate'
 observer=source/'tests/native/freezer-storage-probe.js';target=pack/'scripts/qa-freezer-storage-probe.js';shutil.copy2(observer,target);main=pack/'scripts/main.js';original=main.read_bytes();main.write_bytes(original+b"\nimport './qa-freezer-storage-probe.js';\n")
 setup={'scope':'Native four-slot complete ItemStack storage, lazy legacy adoption, intrinsic item guard, restart/extraction/rollback/reanchor/craft retirement','source_commit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=source,text=True).strip(),'base_context':str(context),'test_only_overlays':['Owned main.js observer import','qa-freezer-storage-probe.js'],'fresh_world':True,'client':False,'simulated_players':False,'live_mutated':False}
 from family_update.freezer_storage_preservation import inspect_world as inspect_native_inventory
 uuid=read(source/'baseline.json')['packs']['BP']['uuid']
 (out/'setup.json').write_text(json.dumps(setup,indent=2)+'\n');runs=[];rows=[];inventories=[]
 for phase in ['first','restart']:
  run=native_common.native_run(out,phase,minimum_seconds=35);runs.append(run)
  text=(out/(phase+'.log')).read_text(errors='replace');phase_rows=[json.loads(line.split('[FREEZER_STORAGE_QA] ',1)[1])for line in text.splitlines()if '[FREEZER_STORAGE_QA] 'in line];rows.extend(phase_rows)
  good=run['ok'] and any(r.get('kind')=='done' and r.get('phase')==phase and r.get('players')==0 for r in phase_rows)and not any(r.get('kind')=='failure'for r in phase_rows)
  print(json.dumps({'phase':phase,'ok':good,'errors':run['errors'],'rows':phase_rows}),flush=True)
  if not good:break
  inventories.append(inspect_native_inventory(world,uuid))
 ok=len(runs)==2 and all(r['ok']for r in runs)and len([r for r in rows if r.get('kind')=='done'])==2 and not any(r.get('kind')=='failure'for r in rows)and len(inventories)==2 and len(inventories[0])==1 and inventories[0]==inventories[1]
 # Retain failed worlds/overlays; restore only the declared successful overlay.
 if ok:main.write_bytes(original);target.unlink();native_common.audit_candidate(world,receipt)
 report={**setup,'ok':ok,'runs':runs,'rows':rows,'complete_native_inventory_nbt':inventories,'base_candidate_unchanged':ok};(out/'report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'ok':ok,'report':str(out/'report.json')}),flush=True);return 0 if ok else 1
if __name__=='__main__':raise SystemExit(main())
