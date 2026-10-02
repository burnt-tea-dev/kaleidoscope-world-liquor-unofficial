"""Unchanged original sprite audit; no client rendering claim."""
from pathlib import Path
import hashlib,json,os,subprocess
from PIL import Image
root=Path(__file__).resolve().parents[1]
source=json.loads((root/'data/effect-icon-source.json').read_text())
assert source['jar_sha256']=='d29a7507b3cfc90f9ff620d75e69102c0d25b3de8dbd0d89c73331e4c9e12205'
assert len(source['unchanged_pngs'])==15
for row in source['unchanged_pngs']:
 path=root/'runtime/RP'/row['runtime']
 assert hashlib.sha256(path.read_bytes()).hexdigest()==row['sha256'],path
 assert Image.open(path).size==tuple(row['size'])==(18,18),path
print('15 original World Liquor effect sprites verified unchanged; client rendering not tested')
tavern=Path(os.environ.get('TAVERN_ROOT',str(root.parent/'tavern-src')))
subprocess.run(['node',str(tavern/'tools/build_effect_icon_hud.mjs'),'--world-liquor',str(root),'--check'],check=True)
hud=json.loads((root/'runtime/RP/ui/kt_world_liquor_effects.json').read_text())
assert not (root/'runtime/RP/ui/hud_screen.json').exists()
assert hud['namespace']=='kaleidoscope_world_liquor_effects'
assert set(hud)=={'namespace','effect_panel'}
assert json.loads((root/'runtime/RP/ui/_ui_defs.json').read_text())=={'ui_defs':['ui/kt_world_liquor_effects.json']}
assert json.loads((root/'runtime/RP/ui/_global_variables.json').read_text())=={'$kt_world_liquor_effect_panel':'kaleidoscope_world_liquor_effects.effect_panel'}
controls=hud['effect_panel']['controls'];assert len(controls)==1+32*15
for control in controls[1:]:
 image=next(iter(control.values()))
 assert (root/'runtime/RP'/(image['texture']+'.png')).is_file()
 assert image['bindings'][0]['source_control_name']=='kwl_effect_data'
print('World Liquor owns a fully typed panel in its own namespace; never defines hud.root_panel')
subprocess.run(['python3',str(tavern/'tools/check_effect_ui_contract.py'),'--liquor',str(root)],check=True)
