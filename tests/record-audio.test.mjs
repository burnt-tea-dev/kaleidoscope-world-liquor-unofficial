// Isolated production-script callbacks, not native BDS/client acceptance.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../runtime/BP/scripts/record-audio.js',import.meta.url),'utf8').replace(/^import .*;\n/,'').replaceAll('export function','function');
const N='kaleidoscope_world_liquor',prefix=N+':storage/overworld/',sound=N+'.music_disc.random_disc.station_0';
function fixture(){
 const rows=new Map(),blocks=new Map(),timers=[],commands=[],drops=[];let explosion;
 const dim={id:'minecraft:overworld',getBlock:p=>{const b=blocks.get(p.x);if(b==='unloaded')throw Error('unloaded');return b;},runCommand:c=>commands.push(c),spawnItem:i=>drops.push(i),playSound(){}};
 const world={gameRules:{doTileDrops:true},getDynamicPropertyIds:()=>[...rows.keys()],getDynamicProperty:k=>rows.get(k),setDynamicProperty:(k,v)=>v===undefined?rows.delete(k):rows.set(k,v),getDimension:()=>dim,afterEvents:{explosion:{subscribe:f=>explosion=f}}};
 const ctx=vm.createContext({world,system:{runInterval:f=>timers.push(f)},ItemStack:class{constructor(id){this.typeId=id;}}});vm.runInContext(source,ctx);
 const add=(x,type,state)=>{const b={typeId:type,dimension:dim,location:{x,y:64,z:0}};blocks.set(x,b);rows.set(prefix+x+'_64_0',typeof state==='string'?state:JSON.stringify(state));return b;};
 return {rows,blocks,timers,commands,drops,world,add,start:()=>vm.runInContext('installRecordCleanup()',ctx),explode:bs=>explosion({getImpactedBlocks:()=>bs})};
}
test('reload preserves wall records and jukebox payloads across repeated cleanup ticks',()=>{
 const f=fixture();f.add(0,N+':wall_record',{record:'minecraft:music_disc_cat'});f.add(1,'minecraft:jukebox',{record:N+':custom_record',recordSound:sound});f.start();for(let i=0;i<5;i++)f.timers[0]();assert.equal(f.rows.size,2);assert.deepEqual(f.commands,[]);
});
test('stale audio metadata never makes a valid wall decoration disposable',()=>{const f=fixture();f.add(0,N+':wall_record',{record:'minecraft:music_disc_cat',recordSound:sound});f.start();f.timers[0]();assert.equal(f.rows.size,1);assert.deepEqual(f.commands,[]);});
test('removed jukebox stops audio and clears only its own payload',()=>{const f=fixture();f.add(0,N+':wall_record',{record:'minecraft:music_disc_cat'});f.add(1,'minecraft:air',{record:N+':custom_record',recordSound:sound});f.start();f.timers[0]();assert.equal(f.rows.size,1);assert.deepEqual(f.commands,['stopsound @a '+sound]);});
test('unloaded chunks and corrupt rows do not lose saved items',()=>{const f=fixture();f.add(0,'minecraft:jukebox',{record:N+':custom_record',recordSound:sound});f.blocks.set(0,'unloaded');f.add(1,N+':wall_record','{broken');f.start();f.timers[0]();assert.equal(f.rows.size,2);assert.deepEqual(f.commands,[]);});
test('audio explosion callback leaves wall drops to furniture, handles jukebox once',()=>{const f=fixture();const wall=f.add(0,N+':wall_record',{record:'minecraft:music_disc_cat'}),box=f.add(1,'minecraft:air',{record:N+':custom_record',recordSound:sound});f.start();f.explode([wall,box]);f.explode([wall,box]);assert.equal(f.rows.size,1);assert.deepEqual(f.drops.map(x=>x.typeId),[N+':custom_record']);});
test('doTileDrops=false also suppresses jukebox explosion drops',()=>{const f=fixture();f.world.gameRules.doTileDrops=false;const b=f.add(0,'minecraft:air',{record:N+':custom_record',recordSound:sound});f.start();f.explode([b]);assert.equal(f.drops.length,0);});
