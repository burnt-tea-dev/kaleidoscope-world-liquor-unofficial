import {world,system,BlockPermutation,GameMode} from '@minecraft/server';
import * as gt from '@minecraft/server-gametest';
import {applyCaptainWaterStep} from './captain-gift.js';
import {eyesUnderWater} from './liquid-contact.js';
const wait=t=>new Promise(r=>system.runTimeout(r,t)),KEY='captain_qa:state';
system.afterEvents.scriptEventReceive.subscribe(e=>{if(e.id==='captain_qa:run')run().catch(e=>console.error('CAPTAIN_QA_FATAL '+e+' '+e.stack));});
async function run(){
 const d=world.getDimension('overworld'),checks=[],samples=[];let player;
 const check=(name,ok)=>{checks.push({name,passed:!!ok});console.warn('CAPTAIN_QA_CHECK '+JSON.stringify(checks.at(-1)));if(!ok)throw Error(name);};
 const saved=world.getDynamicProperty(KEY),phase=saved?'restart':'first';
 const apply=e=>applyCaptainWaterStep(e,{underWater:eyesUnderWater(e)});
 try{
  if(!saved){
   d.runCommand('fill -4 79 -4 20 79 4 stone');d.runCommand('fill -4 80 -4 20 87 4 air');
   d.runCommand('fill -3 80 -3 3 80 3 water');
   const flow=BlockPermutation.resolve('minecraft:flowing_water',{liquid_depth:4});
   const fillFlow=()=>{for(let x=6;x<=10;x++)for(let z=-2;z<=2;z++)d.getBlock({x,y:80,z}).setPermutation(flow);};fillFlow();
   d.runCommand('fill 13 80 -2 13 80 2 water');
   const control=d.spawnEntity('captain_qa:mover',{x:-2,y:81.1,z:0}),source=d.spawnEntity('captain_qa:mover',{x:0,y:81.1,z:0}),
    flowing=d.spawnEntity('captain_qa:mover',{x:8,y:81.1,z:0}),wide=d.spawnEntity('captain_qa:wide',{x:14.9,y:81.1,z:0}),narrow=d.spawnEntity('captain_qa:narrow',{x:14.9,y:81.1,z:2});
   player=gt.spawnSimulatedPlayer({dimension:d,x:2,y:81.1,z:1},'CaptainWaterProbe',GameMode.Survival);
   player.teleport({x:2,y:81.1,z:1});
   for(let t=0;t<24;t++){
    fillFlow();for(const e of [source,flowing,wide,player])apply(e);
    await wait(1);
    samples.push({tick:t,source:source.location.y,flowing:flowing.location.y,wide:wide.location.y,narrow:narrow.location.y,player:player.location.y,sourceV:source.getVelocity().y,flowV:flowing.getVelocity().y,inWater:source.isInWater});
   }
   console.warn('CAPTAIN_QA_SAMPLES '+JSON.stringify(samples));
   const surface=Math.fround(80+Math.fround(8/9)),flowSurface=Math.fround(80+Math.fround(4/9));
   check('native source-water body rests on original fluid height',Math.abs(source.location.y-surface)<.0002);
   check('native flowing-water body rests on original fluid height',Math.abs(flowing.location.y-flowSurface)<.0002);
   check('native Player rests on original source-water height',Math.abs(player.location.y-surface)<.0002);
   check('native wide body reaches shore while narrow body falls',Math.abs(wide.location.y-surface)<.0002&&narrow.location.y<surface-.1);
   check('unaffected control still enters the water',control.location.y<surface-.1);
   for(const e of [control,flowing,wide,narrow])e.remove();
   const before=source.location.y;await wait(8);check('stopping the effect releases the supported body',source.location.y<before-.1);source.teleport({x:0,y:81.1,z:0});source.clearVelocity();
   for(let i=0;i<16;i++){apply(source);await wait(1);}
   check('effect can regain its original surface',Math.abs(source.location.y-surface)<.0002);
   world.setDynamicProperty(KEY,JSON.stringify({id:source.id,surface}));
  }else{
   const row=JSON.parse(saved),entity=world.getEntity(row.id);check('native body identity survives world restart',!!entity?.isValid);
   for(let i=0;i<16;i++){apply(entity);await wait(1);}
   check('same-world native body regains its original surface',Math.abs(entity.location.y-row.surface)<.0002);entity.remove();world.setDynamicProperty(KEY,undefined);
  }
 }finally{try{player?.disconnect();}catch{}}
 await wait(3);check('QA simulated Player disconnected',world.getAllPlayers().length===0);
 console.warn('CAPTAIN_QA_RESULT '+JSON.stringify({passed:true,phase,checks,playersAfter:0,samples:samples.slice(-3)}));
}
