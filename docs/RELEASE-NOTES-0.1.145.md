# World Liquor0.1.145

Freezer surfaces now animate the selected source texture strip instead of
remaining on its first frame. Water/milk use32 frames at2 ticks; original Java
lava uses20 frames in its38-step ping-pong sequence. Water/lava pixels come from
the verified Minecraft1.21.1 client, and milk from maintained World Liquor1.1.11.
Water retains source alpha without an extra opacity multiplier.

Existing legacy magma outputs retain their original3-frame/8-tick RGB blending
through a derived24-tick atlas; the original legacy strip remains unchanged.
Magma is not restored as a current recipe. Source geometry, result height,
freezer quantities, timing, storage and extraction semantics are preserved.

Paired sources are Tavern0.6.167 and Grilling2.8.143. Client playback, lighting,
resource-stack behavior and full Java parity remain pending human acceptance;
static checks and native loading are separate evidence.
