# World Liquor 0.1.59 — recovered reviewed source candidate

Retains main's Tavern 0.6.94 guide/native-cabinet pairing, Java hand/item/freezer
art repairs and isolated optional original effect sprites. Adds the Git-backed
compact texture and Java instant-effect fixes from the retained parallel branch.

Twelve PNGs keep identical bytes under shorter canonical paths; public terrain
keys, geometry IDs and display indices stay stable. Respawn follows the Java
center/perimeter/down-before-up search, preserves facing and endpoint audio;
Crazy audio uses pitch 1.5, Ground Crit includes climb/blindness/riding eligibility,
and Elbow Strike hit audio uses volume 0.6. See the retained source branch's
0.1.56 release notes and the recovery plan for source provenance and limitations.

This does not implement Java collision-shape queries, fallDistance assignment or
Elbow Strike's ATTACK_KNOCKBACK attribute. Stable Bedrock approximations remain
bounded. Existing callback fixtures establish source behavior only.

All existing version/history/UUID and guide evidence is retained. Divergent
historical identities are preserved in RECOVERY-HISTORY-20261004.json. The lost
0.1.58 staging is not represented as recovered. Publication and client acceptance
remain blocked; no BDS, saved-world, client-rendering or production claim is made.
