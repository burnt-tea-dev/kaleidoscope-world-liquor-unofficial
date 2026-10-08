# World Liquor 0.1.100 — addon beheading head resolution

Current Java World Liquor NeoForge1.21.1 1.1.11 (CF9066406), EventHandlers.getEntityHead, tries registered items in the dead entity namespace in this order: `<path>_head`, `<path>_skull`, `skull_<path>`, `head_<path>`, `dead_<path>`, `<path>_item`. The previous Bedrock death callback only had six vanilla entries and omitted all addon candidates.

The production death callback now uses that registry lookup, skips absent/air entries and keeps the six vanilla mappings first. No addon namespace allowlist or guessed texture matching is used. No matching item means no extra head. Existing combat tests cover priority, namespace isolation, missing entries and vanilla precedence. Full-family loading, saved-world and live evidence remain deployment gates; no new standalone engine probe is needed for this registry-selection change.

Still incomplete: exact incoming-damage cancellation/recursive hurt/fallback phases, persistent beheaded marker, actual death-drop collection deduplication, player SkullOwner skin data, source arbitrary class/tag equivalence and client acceptance. This is a concrete missing drop-resolution repair, not complete Java beheading parity. CaptainGift movement collision/ground/fallDistance hooks also remain unavailable through the reviewed stable script API; no replacement buoyancy formula was shipped.
