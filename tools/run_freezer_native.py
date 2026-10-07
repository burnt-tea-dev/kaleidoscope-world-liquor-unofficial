"""Affected-path native timing experiment on a fresh canonical family copy.

This adds a declared observer import to a disposable BP copy only. It is not
an installer, a family admission receipt, or a client result.
"""
from pathlib import Path
import argparse, hashlib, json, os, shutil, subprocess, sys, time

def read(path):return json.loads(Path(path).read_text())
def sha(path):return hashlib.sha256(Path(path).read_bytes()).hexdigest()
def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--family-config',type=Path,required=True)
    parser.add_argument('--source',type=Path,required=True)
    parser.add_argument('--output',type=Path,required=True)
    parser.add_argument('--port',type=int,required=True)
    args=parser.parse_args();config=read(args.family_config);context=Path(config['output_dir'])
    source=args.source.resolve();output=args.output.resolve()
    assert not output.exists() and not output.is_relative_to(source),'Preserve previous/source evidence'
    sys.path.insert(0,str(Path(config['sources']['tavern'])/'tools'))
    from family_update import common
    common.configure(args.family_config)
    from family_update import native_common
    from family_update.storage import require_space,allocated
    candidate=context/'release-candidate';receipt=read(candidate/'family-receipt.json')
    native_common.audit_candidate(candidate,receipt)
    inputs=common.engine_inputs();prior=read(context/'exact-engine/native-report.json')
    assert prior['bds'] and inputs==prior['engine_inputs'],'Exact native engine evidence required'
    require_space(context,'Native freezer timing',allocated(candidate))
    native_common.setup_engine(output,'Freezer Timing QA',args.port,expected_inputs=inputs)
    world=output/'worlds/Freezer Timing QA';world.parent.mkdir();shutil.copytree(candidate,world)
    native_common.blank_level(world,'Freezer Timing QA');native_common.audit_candidate(world,receipt)
    baseline=read(source/'baseline.json');uuid=baseline['packs']['BP']['uuid'];pack=world/'behavior_packs'/uuid
    affected=['runtime/BP/scripts/furniture.js','runtime/BP/scripts/freezer-state.js','runtime/BP/blocks/freezer.json']
    for name in affected:
        relative=Path(name).relative_to('runtime/BP');assert sha(source/name)==sha(pack/relative),'Candidate/source functional mismatch'
    observer=source/'tests/native/freezer-tick-probe.js';target=pack/'scripts/qa-freezer-tick-probe.js'
    shutil.copy2(observer,target);main=pack/'scripts/main.js';original=main.read_bytes()
    main.write_bytes(original+b"\nimport './qa-freezer-tick-probe.js';\n")
    setup={'scope':'Real native custom-block tick/countdown for1200/1800-tick recipes at three placement phases',
           'engine_inputs':inputs,'candidate_receipt_sha256':sha(candidate/'family-receipt.json'),
           'source_commit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=source,text=True).strip(),
           'source_inputs':{name:sha(source/name) for name in [*affected,'tests/native/freezer-tick-probe.js']},
           'test_only_overlays':['Owned main.js observer import','qa-freezer-tick-probe.js'],
           'base_context':str(context),'fresh_world':True,'simulated_players':False,'client':False,'live_mutated':False}
    (output/'setup.json').write_text(json.dumps(setup,indent=2)+'\n');log=output/'native.log'
    with log.open('w')as stream:
        process=subprocess.Popen(['./bedrock_server'],cwd=output,env={**os.environ,'LD_LIBRARY_PATH':str(output)},stdin=subprocess.PIPE,stdout=stream,stderr=subprocess.STDOUT,text=True)
        try:
            deadline=time.monotonic()+240
            while time.monotonic()<deadline:
                time.sleep(1);body=log.read_text(errors='replace')
                if ('[FREEZER_TICK_QA]'in body and ('"kind":"done"'in body or '"kind":"failure"'in body))or ' ERROR]'in body or process.poll()is not None:break
            if process.poll()is None:process.communicate('stop\n',timeout=30)
        finally:
            if process.poll()is None:process.kill();process.wait()
    body=log.read_text(errors='replace');rows=[json.loads(line.split('[FREEZER_TICK_QA] ',1)[1])for line in body.splitlines()if '[FREEZER_TICK_QA] 'in line]
    cases=[row for row in rows if row['kind']=='case'];done=[row for row in rows if row['kind']=='done'];errors=[line for line in body.splitlines()if ' ERROR]'in line or '[error]'in line.lower()]
    unchanged=all(sha(source/name)==value for name,value in setup['source_inputs'].items())
    ok=process.returncode==0 and not errors and len(cases)==12 and bool(done)and done[-1]['players']==0 and 'Player connected:'not in body and not any(row['kind']=='failure'for row in rows)and unchanged
    # Restore only the declared disposable overlay, then audit unchanged base.
    main.write_bytes(original);target.unlink();native_common.audit_candidate(world,receipt)
    report={**setup,'ok':ok,'exit_code':process.returncode,'errors':errors,'source_unchanged':unchanged,'cases':cases,'rows':rows,'base_candidate_unchanged':True}
    (output/'report.json').write_text(json.dumps(report,indent=2)+'\n')
    # Keep the affected-path world and explicit overlay evidence. This is not
    # the exact first/restart evidence required by the canonical pack pruner.
    print(json.dumps({'ok':ok,'cases':len(cases),'errors':len(errors),'report':str(output/'report.json')}),flush=True)
    return 0 if ok else 1
if __name__=='__main__':raise SystemExit(main())
