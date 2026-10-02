"""Pinned source topology and counterfactual guards; no engine simulation."""
import copy,json,unittest
from unittest.mock import patch
import update_java_face_topology as audit
class Topology(unittest.TestCase):
 def test_current(self):audit.check()
 def test_exact_scope_and_face_reduction(self):
  rows=audit.read(audit.SOURCE/'face-pruning.json')['entries']
  self.assertEqual(11,len(rows));self.assertEqual(492,sum(r['before_faces'] for r in rows));self.assertEqual(342,sum(r['after_faces'] for r in rows))
 def altered(self,mutate):
  read=audit.read;path=audit.ROOT/'runtime/RP/models/entity/kwl_g_1559f531fcdb7ed3.geo.json'
  def change(p):
   j=read(p)
   if p==path:mutate(j)
   return j
  with patch.object(audit,'read',change):
   with self.assertRaises(AssertionError):audit.check()
 def test_coordinate_mutation_is_not_hidden_by_face_pruning(self):
  self.altered(lambda j:j['minecraft:geometry'][0]['bones'][1]['cubes'][0]['origin'].__setitem__(0,999))
 def test_retained_uv_mutation_fails(self):
  def mutate(j):
   c=next(c for b in j['minecraft:geometry'][0]['bones'] for c in b.get('cubes',[]) if c['uv']);next(iter(c['uv'].values()))['uv'][0]+=1
  self.altered(mutate)
 def test_missing_required_face_fails(self):
  def mutate(j):
   c=next(c for b in j['minecraft:geometry'][0]['bones'] for c in b.get('cubes',[]) if c['uv']);c['uv'].pop(next(iter(c['uv'])))
  self.altered(mutate)
 def test_added_obsolete_face_fails(self):
  def mutate(j):
   c=next(c for b in j['minecraft:geometry'][0]['bones'] for c in b.get('cubes',[]) if len(c['uv'])<6);side=next(s for s in ['up','down','east','west','north','south'] if s not in c['uv']);c['uv'][side]={'uv':[0,0],'uv_size':[0,0],'material_instance':'default'}
  self.altered(mutate)
if __name__=='__main__':unittest.main()
