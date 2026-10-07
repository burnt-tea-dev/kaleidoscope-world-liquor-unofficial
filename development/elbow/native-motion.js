/** Confirmed Native queued-velocity operation; not a production subscriber.
 * Source state and accepted-melee proof must be supplied by the caller.
 * Never reads the still-uncommitted Native base kick as a completed velocity.
 */
export function replaceQueuedVelocity(entity,velocity){
 if(!velocity||!['x','y','z'].every(axis=>Number.isFinite(velocity[axis])))throw Error('SOURCE_VELOCITY_REQUIRED');
 entity.clearVelocity();
 entity.applyImpulse({x:velocity.x,y:velocity.y,z:velocity.z});
}
