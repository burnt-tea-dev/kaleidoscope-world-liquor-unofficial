"""Import only the source game's three feedback events, never a whole game archive.

Input metadata/index/sounds JSON come from the official Minecraft 1.21.1
publisher. Selected OGG downloads are checked once against its asset index.
Release payload integrity remains the canonical baseline's responsibility.
"""
import argparse
import hashlib
import json
from pathlib import Path
import urllib.request

ROOT=Path(__file__).resolve().parents[1]
EVENTS={'critical':'entity.player.attack.crit','respawn':'item.chorus_fruit.teleport','crazy':'block.beacon.activate'}

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--reference',type=Path,required=True);args=p.parse_args()
    metadata=json.loads((args.reference/'minecraft-1.21.1-metadata.json').read_text())
    assert metadata['id']=='1.21.1'
    index=json.loads((args.reference/'minecraft-1.21.1-assets.json').read_text())['objects']
    sounds=json.loads((args.reference/'minecraft-1.21.1-sounds.json').read_text())
    target=ROOT/'runtime/RP';definitions=json.loads((target/'sounds/sound_definitions.json').read_text())
    source={'minecraft':'1.21.1','metadata_origin':'https://piston-meta.mojang.com/mc/game/version_manifest_v2.json','asset_index':metadata['assetIndex'],'events':{},'scope':'Selected original feedback samples and event entries; client mixing/attenuation remains separate evidence.'}
    for alias,event in EVENTS.items():
        entries=[];files=[]
        for entry in sounds[event]['sounds']:
            row={'name':entry} if isinstance(entry,str) else entry
            assert row.get('type','file')=='file', 'Review nested sound events explicitly'
            name=row['name'];asset='minecraft/sounds/'+name+'.ogg';ref=index[asset]
            url='https://resources.download.minecraft.net/'+ref['hash'][:2]+'/'+ref['hash']
            raw=urllib.request.urlopen(url,timeout=30).read();assert hashlib.sha1(raw).hexdigest()==ref['hash']
            relative='sounds/kwl/java21/'+name
            path=target/(relative+'.ogg');path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(raw)
            entries.append({**row,'name':relative,'stream':False})
            files.append({'author_asset':asset,'publisher_sha1':ref['hash'],'url':url,'output':relative+'.ogg'})
        definitions['sound_definitions']['kaleidoscope_world_liquor.java.'+alias]={'category':'player','sounds':entries,'max_distance':16}
        source['events'][alias]={'event':event,'original':sounds[event],'files':files}
    (target/'sounds/sound_definitions.json').write_text(json.dumps(definitions,indent=2)+'\n')
    (ROOT/'data/java-feedback-audio.json').write_text(json.dumps(source,indent=2)+'\n')

if __name__=='__main__':main()
