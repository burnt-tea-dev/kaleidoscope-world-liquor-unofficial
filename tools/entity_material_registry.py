"""Resolve current entity/RC aliases through the standard client material entry.

This checks the source load contract, not a RenderDragon shader compilation or
rendered client result. Keep builtin shader options and authored surface data.
"""
import json
import os
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
BUILTINS=frozenset({'entity_alphatest','entity_alphatest_one_sided','entity_alphablend'})


def read(path):return json.loads(path.read_text(encoding='utf-8-sig'))


def check(rp,provider_rps=()):
    rp=Path(rp);entry=rp/'materials/entity.material'
    assert entry.is_file(), 'Missing standard materials/entity.material registry entry'
    document=read(entry);assert set(document)=={'materials'}
    definitions=document['materials'];assert definitions.get('version')=='1.0.0'
    parents={}
    for key,value in definitions.items():
        if key=='version':continue
        assert key.count(':')==1 and isinstance(value,dict), 'Invalid entity material inheritance'
        name,parent=key.split(':');assert name and parent and name not in parents
        parents[name]=parent
    def resolve(name,seen=()):
        if name in BUILTINS:return
        assert name not in seen, 'Cyclic entity material inheritance: '+name
        assert name in parents, 'Entity material not defined in standard registry: '+name
        resolve(parents[name],(*seen,name))
    for name in parents:resolve(name)
    controllers={}
    for provider in [rp,*map(Path,provider_rps)]:
        for path in (provider/'render_controllers').rglob('*.json'):
            for name,value in read(path).get('render_controllers',{}).items():
                assert name not in controllers or controllers[name]==value, 'Conflicting render controller: '+name
                controllers[name]=value
    entities=references=0
    for directory,kind in [('entity','minecraft:client_entity'),('attachables','minecraft:attachable')]:
        for path in (rp/directory).rglob('*.json'):
            description=read(path)[kind]['description'];aliases=description.get('materials',{})
            for name in aliases.values():resolve(name)
            for row in description.get('render_controllers',[]):
                for name in ([row] if isinstance(row,str) else row):
                    assert name in controllers, 'Missing local render controller: '+name
                    for materials in controllers[name].get('materials',[]):
                        for reference in materials.values():
                            assert reference.lower().startswith('material.'), 'Unreviewed material selector: '+reference
                            alias=reference.split('.',1)[1]
                            assert alias in aliases, 'Render controller material absent from friendly list: '+alias
                            resolve(aliases[alias]);references+=1
            entities+=1
    return {'standard_entry':'materials/entity.material','custom_materials':len(parents),'client_entities_and_attachables':entities,
            'resolved_render_material_references':references,'client_rendering_tested':False}


if __name__=='__main__':
    tavern=Path(os.environ.get('TAVERN_ROOT',str(ROOT.parent/'tavern-src')))
    print(json.dumps(check(ROOT/'runtime/RP',[tavern/'runtime/RP'])))
