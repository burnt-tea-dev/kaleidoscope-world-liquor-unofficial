# World Liquor 0.1.76

Restore current NeoForge1.1.11 boating multiplier `1.3f+min(amp*.2f,1f)`, uniform1.2 horizontal cap and source0.85f braking/epsilon. Only the controlling rider applies it; remove invented water/ice/land coefficients and passenger stacking.

Replace unconditional air button jumps with the source tick eligibility, fresh-press/falling direction and allowance; preserve usable-elytra, water, levitation, passenger and flying exclusions. Jump power includes source jump boost, honey factor and sprint yaw lookup. Reverse head/tail velocity handles slow fall, levitation, flight and liquids, with native post-physics impulse compensation. Use real AABB/fluid queries because native Entity has no isInLava getter. Fresh player victim lifecycle also clears transient kill credit.

92 independent Java numeric cases, 30 focused program regressions and real BDS motion/fluid samples support these changes. These are not human client acceptance or full movement parity. Native player/ceiling ground state, travel positions, shallow-lava physics, camera/input/eye direction and all remaining effects remain pending. See JAVA-MOTION-20261007.md and the paired client scenes. Tavern runtime remains0.6.114.
