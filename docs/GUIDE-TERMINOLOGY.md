# Owned guide terminology

Recreated source candidate; independent review is pending. Earlier lost local review artifacts are not reused as certification.

## Exact inventory

- 67 entries; 34 complete structured recipes
- 268 stable concept IDs and 471 native/guide comparisons
- 663 locale fields (non-preview); 25 live bottle/cup state aliases
- 2125 guide strings; 0 actual runtime message-source files
- 30 shared locale keys checked against the selected Tavern source

Run `node tools/check_guide_terminology.mjs --self-test`. World Liquor additionally accepts `TAVERN_ROOT` pointing to the paired Tavern source. The checker imports real pure source projections, checks nonempty bodies and exact visible inventory, canonical ID/native bindings, live-state parent relations, retired aliases, real prompt-source literals, all structured recipe fields and prose quantities against the original source proof.

The glossary is keyed by IDs, not global synonyms. Distinct tiers, food qualities, machine types and placed/held states remain distinct. Exact snapshots are regression evidence, not a claim to prove all natural language. Third-party originals, dead `kt_assets_*` previews, debugging terminology and native/client acceptance are outside this check. No author-original file is copied into this candidate.

## Canonical decisions

Tavern uses 果盆, 龙头/龍頭, 空瓶子, 空酒杯, 谜之鸡尾酒/謎之雞尾酒; 黄金/黃金葡萄, 青提葡萄 and vanilla 荧光莓/螢光莓 families. The glow family intentionally normalizes Java wording to the player's standard name. Rack labels are 单体/單體, 圆周/圓周, 倾斜/傾斜 and 窖藏酒柜/窖藏酒櫃. Exact Traditional furniture/color corrections preserve IDs and colors. Native bottle displays retain a localized display suffix; cups retain the parent drink name.

Grilling uses 石磨 (distinct from vanilla 砂轮/砂輪), 辣椒油 and 熔岩辣椒油, 菜刀 with the full 森罗厨房/森羅廚房 modifier where needed, and distinct base/advanced kitchen racks. CN `green_chili_powder` retains Java's explicit 绿辣椒粉, while its ingredient remains 青辣椒; TW uses 青辣椒粉. Held `skewer_plate` is intentionally 有烤串的盘子/有烤串的盤子/Plate of Skewers while its placed form is 烤串盘/烤串盤/Skewer Plate.

Cookery1.6.2's actual `minecraft:display_name` keys for `oil_pot` resolve to 油罐 / 油罐 / Oil Can and `oil_pot_filled` to 装满的油罐 / 裝滿的油罐 / Filled Oil Can. These names supersede the earlier unverified Oil Pot translation. `enamel_basin` is a different ID and is not renamed. Verification source archive SHA256: f994f8aa3b3aa4ab323c021f871f05291a827e7957aa265e17e91a085ba85b81.

The designated original Cookery1.6.2 millstone accepts extension recipe registration but its three input gates reject these extension ingredients in exact-source model tests. Powder pages preserve recipe records and state the native-support limitation under normal clean installation. This is not a statement that a transformed host can never work, and does not certify the existing transformation architecture. No native engine acceptance is claimed.

## Semantic boundary

`data/guide-terminology-semantic.json` compares the fresh original source's complete non-display guide structure and all Arabic/Chinese numeral sequences in player prose. Only explicit three-component dotted version metadata is excluded from numeral comparison. Recipe IDs, ingredient/output counts, qualities, timing, arrays and order are preserved. Historical T148/T149/T152 and G154/G155 witnesses are retained; the successor admits only sealed, reversible display deltas.

Publication, full-family release, native/client acceptance and LIVE deployment remain separate and unapproved by this source gate.
