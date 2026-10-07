import {world,system,BlockPermutation} from '@minecraft/server';
// Imported only into a disposable copy of the owned BP so the observer has
// the same world-DP owner. Never imported by the shipped runtime.
const N='kaleidoscope_world_liquor',active=[],results=[];
const emit=row=>console.log('[FREEZER_TICK_QA] '+JSON.stringify({tick:system.currentTick,...row}));
const wait=n=>new Promise(resolve=>system.runTimeout(resolve,n));
const storage=p=>N+':storage/overworld/'+p.x+'_'+p.y+'_'+p.z;
let failed=false;
function fail(error){if(!failed){failed=true;emit({kind:'failure',error:String(error),simulated_players:false});}}
world.afterEvents.worldLoad.subscribe(()=>system.runTimeout(async()=>{try{
 if(world.getAllPlayers().length)throw Error('Players prohibited');
 const dimension=world.getDimension('overworld');dimension.runCommand('tickingarea add circle 0 80 0 2 freezer_tick_qa');
 for(let i=0;i<100;i++){try{if(dimension.getBlock({x:0,y:80,z:0}))break;}catch{}await wait(1);}
 dimension.runCommand('fill -2 79 -2 26 83 4 air');dimension.runCommand('fill -2 79 -2 26 79 4 stone');
 const sampler=system.runInterval(()=>{try{
  if(failed)return;
  for(const row of active){
   if(row.done)continue;
   const value=JSON.parse(world.getDynamicProperty(row.key)??'null');if(!value)throw Error('Saved row lost: '+row.label);
   const difference=row.previous-value.remaining;
   if(difference<0||difference>1)throw Error('Non-unit progress: '+row.label+'/'+difference);
   if(difference===1){
    if(row.lastStep!==undefined&&system.currentTick-row.lastStep!==1)throw Error('Native tick gap: '+row.label);
    row.firstStep??=system.currentTick;row.lastStep=system.currentTick;row.steps++;
   }
   if(value.remaining>0&&value.output!==0)throw Error('Early output: '+row.label);
   row.previous=value.remaining;
   if(value.remaining===0){
    if(row.steps!==row.duration||value.output!==row.expected||row.lastStep-row.firstStep!==row.duration-1)throw Error('Completion mismatch: '+row.label);
    row.done=true;const result={kind:'case',case:row.label,duration:row.duration,steps:row.steps,firstStep:row.firstStep,lastStep:row.lastStep,output:value.output,firstDelay:row.firstStep-row.seedTick,outputOnce:true};results.push(result);emit(result);
   }
  }
 }catch(error){fail(error);}},1);
 for(const [phaseIndex,delay]of [0,17,79].entries()){
  if(delay)await wait(delay);
  for(const [recipe,duration,expected]of [['ice',1800,3],['obsidian',1800,1],['pochi_pudding',1200,1],['magma_block',1800,3]]){
   const p={x:phaseIndex*8+['ice','obsidian','pochi_pudding','magma_block'].indexOf(recipe)*2,y:80,z:0},block=dimension.getBlock(p);
   block.setPermutation(BlockPermutation.resolve(N+':freezer',{[N+':open']:false,'kaleidoscope_tavern:facing':0}));await wait(2);
   const key=storage(p);world.setDynamicProperty(key,JSON.stringify({type:N+':freezer',recipe:N+':freezer/'+recipe,remaining:duration,output:0,input:[],fluid:null}));
   const row={label:recipe+'/phase'+phaseIndex,key,duration,expected,seedTick:system.currentTick,previous:duration,steps:0,done:false};active.push(row);emit({kind:'seed',case:row.label,duration,seedTick:row.seedTick});
  }
 }
 for(let i=0;i<1900&&!failed&&results.length<12;i++)await wait(1);
 if(failed)return;if(results.length!==12)throw Error('Incomplete native recipes');
 await wait(5);
 for(const row of active){const value=JSON.parse(world.getDynamicProperty(row.key));if(value.remaining!==0||value.output!==row.expected)throw Error('Duplicate output: '+row.label);}
 system.clearRun(sampler);
 emit({kind:'done',cases:results.length,players:world.getAllPlayers().length,simulated_players:false,client:false});
}catch(error){fail(error);}},30));
