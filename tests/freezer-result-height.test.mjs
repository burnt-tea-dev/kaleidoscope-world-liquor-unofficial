import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {freezerResultHeight} from '../runtime/BP/scripts/freezer-visuals.js';
test('result height matches current renderer expressions independently executed by the JVM',()=>{
 const rows=fs.readFileSync(new URL('./fixtures/java-freezer-height.jsonl',import.meta.url),'utf8').trim().split('\n').map(JSON.parse);assert.equal(rows.length,20);
 for(const row of rows)assert.equal(freezerResultHeight(row.count,row.max),row.expected,JSON.stringify(row));
});
