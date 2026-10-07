# Crazy source registry selection

Current source: World Liquor NeoForge 1.21.1 **1.1.11 / CF9066406**,
`CrazyEffect.performEffect` and `ModConfigs.ENABLE_MODDED_EFFECTS`. The source
configuration defaults to false, so the effect selects Minecraft registry
entries, excludes itself, applies each for 200 ticks at the supplied amplifier
with ambient/visible false, then plays beacon activation at volume 1/pitch 1.5.
It applies to LivingEntity, including mobs.

The previous Bedrock branch iterated every native effect. That also included
fatal poison, an empty entry and a later-version native effect not present in
the original Minecraft 1.21.1 registry. Native iteration order also differs
from Java registration order, which matters for instant and health effects.

`crazy-source.js` selects the reviewed 39 Minecraft source identifiers in their
original order and retains the exact native EffectType objects when delivering
their counterparts. The one naming difference is Java hero_of_the_village to
Bedrock village_hero. The stable
[EffectType API](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/effecttype?view=minecraft-bedrock-stable)
exposes getName(), not an id field. Foreign namespaces and unknown names are
excluded. The author default enableModdedEffects=false is preserved; this
repair does not implement the optional true configuration or arbitrary custom
effect behavior.

The actual 1.26.51.1 native observation returned 38 names through getName().
Selection delivers 35 source counterparts and excludes **fatal_poison, empty
and breath_of_the_nautilus**. The four source effects without a native
counterpart remain **unimplemented**: glowing, luck, unluck and dolphins_grace.
The pure selector returns them explicitly as missingJavaEffects; it does not
replace them with guessed native/addon effects. Original registry names,
registration provenance, alias and native observation are recorded in
`data/java-parity/neoforge-1.1.11/crazy-effects.json`.

API regressions call the actual production applyEffect branch and verify mob
delivery, native object identity, duration 200, amplifier and hidden particles,
and the final sound. The native registry observation used no players and is
not drinking, effect-mechanics or client acceptance. Native instant-effect
timing, immunity/interaction, all 35 effect behaviors and sound presentation
remain separately unverified. The Java five-argument MobEffectInstance
constructor also derives showIcon=false from visible=false; Bedrock's stable
EffectAddOptions exposes showParticles but no showIcon setting. The absence of a separate native control does not prove how showParticles=false renders on clients. Original hidden effect icons remain unverified until dot compares the actual native HUD.
