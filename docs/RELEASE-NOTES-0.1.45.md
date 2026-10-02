# 0.1.45: Pair with standalone Tavern 0.6.80

- Keep World Liquor UUIDs, effects, drink colors, source labels and gameplay data.
- Pin both Tavern dependencies to 0.6.80 and keep the paired own RP identity exact.
- A canonical registration builder checks only the two known optional Cookery rice recipes: Dassai and Maotai. If an exact rice ingredient is unavailable, skip only that recipe and its guide link, preserving existing bottles, effects, content and every other recipe. The affected guide page explains the optional requirement in all three languages.
- With Cookery installed, the original payload is unchanged apart from release identity. No vanilla substitute ingredients, private server patch or relaxed Tavern namespace/UNKNOWN_ITEM validation.
- Existing recipe/preparation checks and no-Cookery registration tests are separate from client acceptance. No live deployment.
