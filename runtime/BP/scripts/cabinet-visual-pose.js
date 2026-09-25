/** Java Bar/CellarCabinet renderer slots, independent of engine/world state.
 * Geometry uses a bottle-base root; RP owns pitch and scale. Entity yaw is
 * opposite Java YP. Inventory slot order is deliberately unchanged.
 */
export function cabinetVisualPose(facing,slot,cellar,single=false){
 if(!Number.isInteger(facing)||facing<0||facing>3||!Number.isInteger(slot)||slot<0||slot>=(cellar?9:2))throw new RangeError('Invalid cabinet visual slot');
 const dx=cellar?.325-(slot%3)*.325:single?0:(slot===0?1:-1)*((facing===0||facing===2)?.25:-.25),dz=cellar?.375:0;
 const [x,z]=facing===0?[dx,dz]:facing===1?[-dz,dx]:facing===2?[-dx,-dz]:[dz,-dx];
 return {offset:{x:.5+x,y:cellar?.78-Math.floor(slot/3)*.29:.0625,z:.5+z},rotation:{x:0,y:[0,90,180,-90][facing]}};
}
