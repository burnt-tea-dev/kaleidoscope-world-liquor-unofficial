"""Emit own source-derived numeric JavaScript; no Mojang implementation/JAR is copied."""
import json
from pathlib import Path
root=Path(__file__).resolve().parent
source=root.parents[1]/'data/java-parity/minecraft-1.21.1/vanilla-shape-catalog.json'
output=root.parents[1]/'development/respawn/java-vanilla-block-catalog-1.21.1.js'
runtime_output=root.parents[1]/'runtime/BP/scripts/respawn-catalog.js'
data=json.loads(source.read_text())
assert data['scope']['blocks']==1060 and data['scope']['states']==26684
assert not data['errors']
header='''/** Generated numerical facts from unmodified Mojang Minecraft 1.21.1.
 * Source and mappings are credited in JAVA_BLOCK_CATALOG.source.
 * Do not bundle the official JAR/libraries in public Git.
 * Static records use EmptyBlockGetter at (0,0,0), CollisionContext.empty().
 * Dynamic records are observations in that context, NOT universal collision shapes.
 * Bedrock identifiers/properties need an explicit projection before querying.
 * No unknown addon/block fallback is inferred from these vanilla facts.
 */
'''
helpers='''
export const JAVA_BLOCK_FLAGS = Object.freeze(JAVA_BLOCK_CATALOG.flag_bits);
export function javaSourceStateKey(blockId, properties = {}) {
 const names = Object.keys(properties).sort();
 return names.length ? blockId + '[' + names.map(name => name + '=' + String(properties[name])).join(',') + ']' : blockId;
}
function decoded(key, row, dynamic) {
 if (!row) return undefined;
 return {key, collisionBoxes: JAVA_BLOCK_CATALOG.shapes[row[0]], flags: row[1], fluid: JAVA_BLOCK_CATALOG.fluids[row[2]], dynamic};
}
/** Requires an exact named Java state; missing/unknown properties stay unresolved. */
export function javaStaticStateFacts(blockId, properties = {}) {
 const key = javaSourceStateKey(blockId, properties);
 return decoded(key, (Object.hasOwn(JAVA_BLOCK_CATALOG.static_states, key) ? JAVA_BLOCK_CATALOG.static_states[key] : undefined), false);
}
/** Context-specific observations only; must not use as fixed live geometry. */
export function javaDynamicStateObservation(blockId, properties = {}) {
 const key = javaSourceStateKey(blockId, properties);
 return decoded(key, (Object.hasOwn(JAVA_BLOCK_CATALOG.dynamic_states, key) ? JAVA_BLOCK_CATALOG.dynamic_states[key] : undefined), true);
}
'''
output.write_text(header+'export const JAVA_BLOCK_CATALOG = Object.freeze('+json.dumps(data,separators=(',',':'),ensure_ascii=True)+');\n'+helpers)
# Runtime only queries one block's compatible states. Keep the full named
# diagnostic catalog above, but omit repeated block/property names from every
# runtime row. Preserve the source table iteration order, including domains.
blocks={block_id:{'properties':block['properties'],'dynamic_shape':block['dynamic_shape'],'rows':[]}
        for block_id,block in data['blocks'].items()}
for table,dynamic in [('static_states',False),('dynamic_states',True)]:
    for key,row in data[table].items():
        block_id,sep,suffix=key.partition('[')
        block=blocks[block_id]
        assert block['dynamic_shape']==dynamic
        values=dict(pair.split('=') for pair in suffix[:-1].split(',')) if sep else {}
        names=sorted(block['properties'])
        assert list(values)==names
        block['rows'].append([*row,*[block['properties'][name].index(values[name]) for name in names]])
for block_id,block in blocks.items():
    assert len(block['rows'])==data['blocks'][block_id]['state_count']
runtime={'source':data['source'],'flag_bits':data['flag_bits'],'blocks':blocks,'shapes':data['shapes'],'fluids':data['fluids']}
encoded=json.dumps(runtime,separators=(',',':'),ensure_ascii=True,allow_nan=False)
runtime_output.write_text(header+'// Row: shape index, flags, fluid index, then sorted property-domain indices.\n'
    +'export const JAVA_BLOCK_CATALOG = Object.freeze(JSON.parse('+json.dumps(encoded,ensure_ascii=True)+'));\n'
    +'export const JAVA_BLOCK_FLAGS = Object.freeze(JAVA_BLOCK_CATALOG.flag_bits);\n')
print(json.dumps({'states':data['scope']['states'],'diagnostic_js_bytes':output.stat().st_size,'runtime_js_bytes':runtime_output.stat().st_size}))
