/** Current NeoForge 1.1.11 EventHandlers.isVanillaCrit, not an air/ground shortcut. */
export function isVanillaCrit(player){
 return player.isOnGround!==true&&player.isClimbing!==true&&player.isInWater!==true
  &&!player.getEffect?.('blindness')&&!player.getComponent?.('minecraft:riding')
  &&player.getVelocity().y<0;
}

/** Java's double-damage chance is evaluated in float, unlike ground crit's double. */
export function doubleDamageChance(amplifier){
 return Math.fround(Math.fround(.2)+Math.fround(Math.fround(amplifier)*Math.fround(.2)));
}

export function javaFloatRoll(roll){
 if(!Number.isFinite(roll)||roll<0||roll>=1)throw Error('INVALID_RNG');
 return Math.floor(roll*16777216)/16777216;
}

export function javaDamageProduct(damage,multiplier){return Math.fround(Math.fround(damage)*Math.fround(multiplier));}

export function tequilaDamageCap(maxHealth,amplifier){
 const fraction=Math.fround(Math.fround(.4)-Math.fround(Math.fround(amplifier)*Math.fround(.05)));
 return javaDamageProduct(maxHealth,Math.max(Math.fround(.05),fraction));
}

/** Java isMeleeAttack rejects projectile/explosion tags and indirect owners. */
export function isMeleeSource(source){
 return !!source.damagingEntity&&!source.damagingProjectile
  &&!['projectile','entityExplosion','blockExplosion','fireworks'].includes(source.cause);
}
