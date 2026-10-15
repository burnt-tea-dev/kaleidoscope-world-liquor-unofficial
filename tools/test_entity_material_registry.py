"""Reject unloaded material definitions and broken entity/RC alias chains."""
import copy
import json
from pathlib import Path
import tempfile
import unittest
from entity_material_registry import check


class RegistryTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup);self.root=Path(self.temp.name)
        self.material={'materials':{'version':'1.0.0','animated:entity_alphablend':{'+defines':['USE_UV_ANIM']}}}
        self.entity={'minecraft:client_entity':{'description':{'identifier':'fixture:water','materials':{'default':'animated'},'render_controllers':['controller.render.water']}}}
        self.controller={'render_controllers':{'controller.render.water':{'materials':[{'*':'Material.default'}]}}}
        self.write('materials/entity.material',self.material);self.write('entity/water.json',self.entity);self.write('render_controllers/water.json',self.controller)
    def write(self,path,value):
        path=self.root/path;path.parent.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(value))
    def test_standard_entry_resolves_entity_and_render_controller_aliases(self):
        self.assertEqual(check(self.root)['resolved_render_material_references'],1)
    def test_arbitrary_material_basename_does_not_satisfy_standard_entity_entry(self):
        (self.root/'materials/entity.material').rename(self.root/'materials/freezer_surface.material')
        with self.assertRaisesRegex(AssertionError,'standard'):check(self.root)
    def test_unresolved_parent_and_cycle_cannot_hide_behind_existing_material_file(self):
        for definitions in [{'animated:missing':{}},{'animated:other':{},'other:animated':{}}]:
            self.write('materials/entity.material',{'materials':{'version':'1.0.0',**definitions}})
            with self.subTest(definitions=definitions),self.assertRaises(AssertionError):check(self.root)
    def test_missing_client_material_and_missing_friendly_render_alias_rejected(self):
        entity=copy.deepcopy(self.entity);entity['minecraft:client_entity']['description']['materials']['default']='missing'
        self.write('entity/water.json',entity)
        with self.assertRaisesRegex(AssertionError,'not defined'):check(self.root)
        self.write('entity/water.json',self.entity)
        controller=copy.deepcopy(self.controller);controller['render_controllers']['controller.render.water']['materials'][0]['*']='Material.missing'
        self.write('render_controllers/water.json',controller)
        with self.assertRaisesRegex(AssertionError,'friendly list'):check(self.root)


if __name__=='__main__':unittest.main()
