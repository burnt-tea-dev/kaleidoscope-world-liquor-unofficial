#!/usr/bin/env python3
"""Repair cabinet-only bindings, preserving all existing addon display indices."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
TAV=ROOT.parent/'tavern-src'
NS='kaleidoscope_world_liquor'
KT='kaleidoscope_tavern'
def read(path):return json.loads(path.read_text())
def write(path,data):path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
def readjs(path):return json.loads(path.read_text().split('=',1)[1].strip().rstrip(';'))
def writejs(path,name,data):path.write_text('export const '+name+' = '+json.dumps(data,ensure_ascii=False,indent=2)+';\n')
def main():
 order=read(ROOT/'data/storage-kind-order.json')
 assert order[25]==KT+':molotov' and order[-1]==KT+':watermelon_juice'
 items=readjs(ROOT/'runtime/BP/scripts/visual-items.js')
 items[KT+':watermelon_juice']=len(order)-1
 compact=readjs(ROOT/'runtime/BP/scripts/compact-items.js')
 if KT+':watermelon_juice' not in compact:compact.append(KT+':watermelon_juice')
 stock=read(TAV/'runtime/RP/entity/runtime_bar_cabinet_bottle_visual.entity.json')['minecraft:client_entity']['description']
 assert stock['geometry']['kind_26']=='geometry.kt_runtime.storage_molotov'
 for mode in ('bar','cellar'):
  path=ROOT/f'runtime/RP/entity/cabinet_{mode}.json';data=read(path);d=data['minecraft:client_entity']['description']
  d['geometry']['kind_25']=stock['geometry']['kind_26']
  key='kind_'+str(len(order)-1)
  d['geometry'][key]=stock['geometry']['kind_27'];d['textures'][key]=stock['textures']['kind_27']
  write(path,data)
  path=ROOT/f'runtime/BP/entities/cabinet_{mode}.json';data=read(path)
  data['minecraft:entity']['description']['properties'][NS+':kind']['range']=[0,len(order)-1]
  write(path,data)
 path=ROOT/'runtime/RP/render_controllers/cabinet.json';data=read(path)
 arrays=data['render_controllers']['controller.render.kwl.cabinet']['arrays']
 arrays['geometries']['Array.models']=[f'Geometry.kind_{i}' for i in range(len(order))]
 arrays['textures']['Array.textures']=[f'Texture.kind_{i}' for i in range(len(order))]
 write(path,data)
 writejs(ROOT/'runtime/BP/scripts/visual-items.js','VISUAL_ITEMS',items)
 writejs(ROOT/'runtime/BP/scripts/compact-items.js','COMPACT_ITEMS',compact)
if __name__=='__main__':main()
