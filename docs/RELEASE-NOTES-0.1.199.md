# World Liquor 0.1.199 — full-tank buckets remain valid freezer inputs

When the freezer tank is full, failed fluid transfer now falls through to the existing ordinary input owner. Store one complete water/lava/grape/berry bucket, debit it even in Creative, and retain the tank contents and native ItemStack metadata. The former ID shortcut returned early instead. Both maintained Java branches follow the transfer-then-input order; see [source, counterexample and validation scope](FREEZER-FLUID-INPUT.md).

The registered source callback suite passes 46 checks, including eight formerly failing full-tank cases. The narrow native callback/Player inventory and same-QA restart observer is prepared but has not run. Prior native observations retain their original scope; none is replayed for coverage. Keep T203/G238 CI pins, SDK, UUIDs, native storage and save formats. This is not complete FluidUtil/native-click/client parity or a LIVE deployment claim.
