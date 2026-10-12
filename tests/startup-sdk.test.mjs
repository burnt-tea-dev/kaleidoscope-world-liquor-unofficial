/** Pure production registration data; no engine, entities, inventory or players. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {payload} from '../runtime/BP/scripts/payload.js';
import {withFoundation} from '../runtime/BP/scripts/foundation.js';
import {preparePacketsFor} from '../runtime/BP/scripts/sdk/protocol.js';
import {canonical,digest} from '../runtime/BP/scripts/sdk/util.js';

test('bounded preparation preserves the complete W125 registration wire and current revision',()=>{
 // This repair changes preparation and release identity; no gameplay data changes.
 // The complete unmodified W125 packet set is an independent predecessor oracle.
 const current=withFoundation(payload),before={...current,version:'0.1.125'};
 function finish(job){let result,yields=0;do{result=job.next();if(!result.done)yields++;}while(!result.done);return {value:result.value,yields};}
 const baseline=finish(preparePacketsFor(before,'baseline_wire'));
 assert.ok(baseline.yields>100);assert.equal(baseline.value.packets.length,175);
 assert.equal(createHash('sha256').update(JSON.stringify(baseline.value.packets)).digest('hex'),'4b177d50639383244d459f662c5f3ffb7ba8e0e45195815bbfde0ef937789185');
 const actual=finish(preparePacketsFor(current));assert.equal(actual.value.revision,'r'+digest(canonical(current)));
 const raw=actual.value.packets.filter(row=>row.id.endsWith(':extension_chunk')).map(row=>JSON.parse(row.message).data).join('');
 assert.equal(raw,canonical(current));assert.ok(actual.value.packets.every(row=>Buffer.byteLength(row.message)<=1900));
});
