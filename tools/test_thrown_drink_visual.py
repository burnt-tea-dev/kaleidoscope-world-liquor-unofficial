"""Targeted regressions for the projectile-only generated sprite owner."""
import copy
import json
import math
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import thrown_drink_visual as m


class ThrownDrinkVisualTests(unittest.TestCase):
    def test_current_catalogue_and_generated_route(self):
        output = m.check()
        self.assertEqual(len(output), 21)
        geo = json.loads(output[m.GEOMETRY])['minecraft:geometry'][0]
        self.assertEqual(len(geo['bones'][0]['cubes']), 23)
        self.assertEqual(geo['bones'][0]['name'], 'body')

    def test_old_scale_and_bottle_bindings_are_replaced(self):
        source = {'minecraft:client_entity': {'description': {
            'geometry': {'kind_0': 'old.placed'}, 'textures': {'kind_0': 'old.atlas'},
            'scripts': {'scale': '0.6'}, 'identifier': 'keep'}}}
        result = m.configure_entity(source, ['mod:a', 'mod:b'])['minecraft:client_entity']['description']
        self.assertNotIn('scale', result['scripts'])
        self.assertEqual(result['geometry'], {'kind_0': m.GEO, 'kind_1': m.GEO})
        self.assertEqual(result['textures']['kind_1'], 'textures/kwl/projectiles/b')
        self.assertEqual(result['identifier'], 'keep')
        self.assertEqual(source['minecraft:client_entity']['description']['scripts'], {'scale': '0.6'})

    def test_ground_extents_and_native_billboard(self):
        output = m.planned()
        cube = json.loads(output[m.GEOMETRY])['minecraft:geometry'][0]['bones'][0]['cubes'][0]
        self.assertEqual(cube['origin'], [-4, -2, -.25])
        self.assertEqual(cube['size'], [8, 8, .5])
        animation = json.loads(output[m.ANIMATION])['animations']['animation.kwl.thrown_drink.billboard']
        self.assertEqual(animation['bones']['body']['rotation'], ['query.camera_rotation(0)', 'query.camera_rotation(1) - query.body_y_rotation', 0.0])

    def test_source_alpha_gap_stays_transparent(self):
        frame = m.Image.new('RGBA', (16, 16))
        frame.putpixel((2, 4), (1, 2, 3, 255))
        frame.putpixel((8, 4), (4, 5, 6, 255))
        spans = m.spans(frame)
        self.assertEqual(spans['up', 4], (2, 8))
        atlas = m.atlas(frame, spans)
        self.assertEqual(atlas.getpixel((16+5, 4)), (0, 0, 0, 0))
        self.assertEqual(atlas.getpixel((16+8, 4)), (4, 5, 6, 255))

    def test_all_source_face_texels_independent_of_generator(self):
        # Decode native cube coordinates as Blockbench does. Expected spans are
        # axis-first source alpha transitions; do not call the owner span helper.
        cubes = json.loads((m.ROOT/m.GEOMETRY).read_text())['minecraft:geometry'][0]['bones'][0]['cubes']
        for name, frame in m.source_frames(m.ROOT):
            bounds = {}
            for f in ('up', 'down', 'west', 'east'):
                for anchor in range(16):
                    alongs = []
                    for along in range(16):
                        x, y = (along, anchor) if f in ('up', 'down') else (anchor, along)
                        dx, dy = {'up': (0, -1), 'down': (0, 1), 'west': (-1, 0), 'east': (1, 0)}[f]
                        nx, ny = x+dx, y+dy
                        if frame.getpixel((x, y))[3] and (not (0 <= nx < 16 and 0 <= ny < 16) or not frame.getpixel((nx, ny))[3]):
                            alongs.append(along)
                    if alongs:
                        bounds[f, anchor] = min(alongs), max(alongs)
            atlas = m.Image.open(m.ROOT/f"runtime/RP/textures/kwl/projectiles/{name.split(':')[1]}.png").convert('RGBA')
            seen = set()
            for cube in cubes:
                x, y, z = cube['origin']; dx, dy, dz = cube['size']
                x = -x-dx; X, Y, Z = x+dx, y+dy, z+dz
                vertices = {'east': ((X,Y,Z),(X,Y,z),(X,y,Z)), 'west': ((x,Y,z),(x,Y,Z),(x,y,z)),
                            'up': ((x,Y,z),(X,Y,z),(x,Y,Z)), 'down': ((x,y,Z),(X,y,Z),(x,y,z)),
                            'south': ((x,Y,Z),(X,Y,Z),(x,y,Z)), 'north': ((X,Y,z),(x,Y,z),(X,y,z))}
                for f, uv in cube['uv'].items():
                    u, v = uv['uv']; du, dv = uv['uv_size']
                    if f in ('up', 'down'):
                        u, v, du, dv = u+du, v+dv, -du, -dv
                    if f in ('north', 'south'):
                        points = [((sx+a)/16,(sy+b)/16) for sx in range(16) for sy in range(16) for a in (.25,.75) for b in (.25,.75)]
                    else:
                        length = round((dx if f in ('up', 'down') else dy)*2)
                        points = [((j+a)/length,b) if f in ('up','down') else (b,(j+a)/length) for j in range(length) for a in (.25,.75) for b in (.25,.75)]
                    o, pu, pv = vertices[f]
                    for a, b in points:
                        px, py, _ = [o[k]+a*(pu[k]-o[k])+b*(pv[k]-o[k]) for k in range(3)]
                        px += {'east': -.25, 'west': .25}.get(f, 0)
                        py += {'up': -.25, 'down': .25}.get(f, 0)
                        sx, sy = math.floor((px+4)*2), math.floor((6-py)*2)
                        want = frame.getpixel((sx, sy))
                        if f not in ('north', 'south'):
                            anchor, along = (sy,sx) if f in ('up','down') else (sx,sy)
                            span = bounds.get((f,anchor)); seen.add((f,anchor))
                            if not span or not span[0] <= along <= span[1]:
                                want = (0,0,0,0)
                        got = atlas.getpixel((math.floor(u+a*du),math.floor(v+b*dv)))
                        self.assertEqual(got[3], want[3], (name,f,sx,sy))
                        if want[3]:
                            self.assertEqual(got, want, (name,f,sx,sy))
            self.assertLessEqual(set(bounds), seen)

    def test_each_runtime_output_mutation_is_rejected(self):
        outputs = m.planned()
        original = Path.read_bytes
        for path, raw in outputs.items():
            def corrupted(p, target=m.ROOT/path):
                return b'broken' if p == target else original(p)
            with self.subTest(path=path), patch.object(Path, 'read_bytes', corrupted):
                with self.assertRaises(AssertionError):
                    m.check()


if __name__ == '__main__':
    unittest.main()
