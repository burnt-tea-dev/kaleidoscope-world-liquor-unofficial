"""Owned player-facing guide copy, separate from recipes and effect tables.

Reference: Loyallay Bedrock Tavern CF9075867 and Cookery CF9054164 guide
presentation, reviewed 2026-10-09. No author guide source was copied.
Mechanics: this repository's W110 runtime, especially effects.js,
bottled-drink.js, furniture.js, freezer-state.js and freezer-output.js.
Each section is a heading and one short paragraph; Tavern owns formatting.
"""

LOCALES = ('en_US', 'zh_CN', 'zh_TW')


def triple(en, cn, tw):
    return dict(zip(LOCALES, (en, cn, tw)))


DRINK_NOTES = {
    'absolut_vodka': triple(
        'From quality 3, Reverse Gravity changes how you rise and fall. Leave room overhead before trying it.',
        '品质 3 起具有反重力效果，会改变升降方式；尝试前请留出头顶空间。',
        '品質 3 起具有反重力效果，會改變升降方式；嘗試前請留出頭頂空間。'),
    'bacardi_carta_blanca': triple(
        'Treasure Sense is its signature effect from quality 3. Nearby containers currently have no visible outline.',
        '品质 3 起以宝藏感知为特色；目前无法显示附近容器的透视轮廓。',
        '品質 3 起以寶藏感知為特色；目前無法顯示附近容器的透視輪廓。'),
    'bamboo_leaf_green_liquor': triple(
        'From quality 3, it grants Invisibility. Further aging makes the effect last longer.',
        '品质 3 起可获得隐身；继续熟成能延长效果。',
        '品質 3 起可獲得隱形；繼續熟成能延長效果。'),
    'bombay_sapphire_gin': triple(
        'From quality 3, Multi-Jump lets you jump again in midair. Higher qualities allow more extra jumps.',
        '品质 3 起可在空中再次跳跃；较高品质可增加额外跳跃次数。',
        '品質 3 起可在空中再次跳躍；較高品質可增加額外跳躍次數。'),
    'cool_tea': triple(
        'From quality 3, it grants Slow Falling and Frost Walker. Higher qualities also offer Fire Resistance and Resistance.',
        '品质 3 起具有缓降与冰霜行者；较高品质还会增加抗火与抗性。',
        '品質 3 起具有緩降與冰霜行者；較高品質還會增加抗火與抗性。'),
    'dassai': triple(
        'Luck is its signature effect from quality 3, but it currently does not improve loot. Do not rely on it for better drops.',
        '品质 3 起以幸运为特色，但目前不会改善战利品；别依赖它提高掉落。',
        '品質 3 起以幸運為特色，但目前不會改善戰利品；別依賴它提高掉落。'),
    'ice_tea': triple(
        'From quality 3, it grants Slow Falling; higher qualities add Fire Resistance and Resistance. Elbow Strike currently plays its sound without an extra attack.',
        '品质 3 起具有缓降；较高品质还有抗火与抗性。肘击目前只有音效，不会追加攻击。',
        '品質 3 起具有緩降；較高品質還有抗火與抗性。肘擊目前只有音效，不會追加攻擊。'),
    'jack_daniel': triple(
        'From quality 3, Beheading gives melee attacks a chance to finish ordinary mobs and drop a supported head. It does not work on bosses.',
        '品质 3 起，近战有机会斩杀普通生物；若有对应头颅物品，也会掉落头颅。不适用于首领。',
        '品質 3 起，近戰有機會斬殺普通生物；若有對應頭顱物品，也會掉落頭顱。不適用於首領。'),
    'johnnie_walker': triple(
        'From quality 3, Treasure Guide gives mob kills and mining a chance to produce extra drops. Higher quality improves the chance.',
        '品质 3 起，击败生物或采掘有机会获得额外掉落；较高品质能提高机会。',
        '品質 3 起，擊敗生物或採掘有機會獲得額外掉落；較高品質能提高機會。'),
    'kwas_chlebowy': triple(
        'From quality 3, grounded melee hits can become critical hits without jumping. Higher quality improves the chance.',
        '品质 3 起，站在地面近战也有机会打出暴击，不必起跳；较高品质能提高机会。',
        '品質 3 起，站在地面近戰也有機會打出暴擊，不必起跳；較高品質能提高機會。'),
    'lafite_1982': triple(
        'From quality 3, it increases maximum health. The extra capacity expires with the effect; higher quality gives a larger boost.',
        '品质 3 起可提高生命上限，效果结束后上限恢复；较高品质可提供更多额外生命。',
        '品質 3 起可提高生命上限，效果結束後上限恢復；較高品質可提供更多額外生命。'),
    'maotai': triple(
        'From quality 3, it grants Levitation and a longer-lasting Slow Falling effect. Higher quality lifts you faster; drink in an open area.',
        '品质 3 起具有飘浮与持续更久的缓降；较高品质会升得更快，宜在开阔处饮用。',
        '品質 3 起具有懸浮與持續更久的緩降；較高品質會升得更快，宜在開闊處飲用。'),
    'pina_colada': triple(
        'From quality 3, Boating Master increases speed while you steer a boat forward. Aging makes the effect last longer.',
        '品质 3 起，在驾驶船只向前划行时可提高船速；继续熟成能延长效果。',
        '品質 3 起，在駕駛船隻向前划行時可提高船速；繼續熟成能延長效果。'),
    'skyy_vodka': triple(
        'Hostile Detection is its signature effect from quality 3. Nearby hostile mobs currently have no visible outline.',
        '品质 3 起以冥视为特色；目前无法显示附近敌对生物的透视轮廓。',
        '品質 3 起以冥視為特色；目前無法顯示附近敵對生物的透視輪廓。'),
    'smirnoff_red_vodka': triple(
        'From quality 3, Hero of the Village improves trading prices. Higher quality strengthens and extends the effect.',
        '品质 3 起具有村庄英雄效果，可改善交易价格；较高品质效果更强、持续更久。',
        '品質 3 起具有村莊英雄效果，可改善交易價格；較高品質效果更強、持續更久。'),
    'sour_plum': triple(
        'From quality 3, it limits the damage taken from a single hit to part of your maximum health. Higher quality lowers that limit.',
        '品质 3 起，单次受伤不超过生命上限的一部分；较高品质能进一步压低单次伤害。',
        '品質 3 起，單次受傷不超過生命上限的一部分；較高品質能進一步壓低單次傷害。'),
    'spiryt_vodka': triple(
        'From quality 3, it helps you stay on still water while standing. Sneaking lets you sink; it does not protect you from lava.',
        '品质 3 起可让你站在静止水面上；潜行可下沉，无法让你安全踩在岩浆上。',
        '品質 3 起可讓你站在靜止水面上；潛行可下沉，無法讓你安全踩在岩漿上。'),
    'strongbow': triple(
        'From quality 3, it grants Absorption and Regeneration. Higher qualities add Fire Resistance and Resistance.',
        '品质 3 起具有伤害吸收与生命恢复；较高品质还会增加抗火与抗性。',
        '品質 3 起具有吸收與生命恢復；較高品質還會增加抗火與抗性。'),
    'around_the_world': triple(
        'A chaotic cocktail that applies many helpful and harmful effects at once for about 10 seconds. Try it somewhere safe.',
        '会同时带来多种有益与有害效果，约持续 10 秒；适合在安全处尝试。',
        '會同時帶來多種有益與有害效果，約持續 10 秒；適合在安全處嘗試。'),
    'gin_tonic': triple(
        'Rapidly restores health for 1 minute. It only heals while you are alive and below full health.',
        '饮用后持续快速恢复生命，持续 1 分钟；仅在存活且未满血时治疗。',
        '飲用後持續快速恢復生命，持續 1 分鐘；僅在存活且未滿血時治療。'),
    'jerk': triple(
        'Drinking causes an immediate explosion at your position. Nearby creatures and blocks may be affected; keep it away from your tavern.',
        '饮用后会立刻在自己所在位置爆炸，可能影响附近生物与方块；请远离酒馆饮用。',
        '飲用後會立刻在自己所在位置爆炸，可能影響附近生物與方塊；請遠離酒館飲用。'),
    'long_island_iced_tea': triple(
        'Returns you to your respawn point when a safe destination can be found. Keep a usable bed or respawn anchor before relying on it.',
        '找到安全落点时可返回重生点；依赖它出行前，先保留可用的床或重生锚。',
        '找到安全落點時可返回重生點；依賴它出行前，先保留可用的床或重生錨。'),
    'pine_colada': triple(
        'For 30 minutes, follow-up damage against a target you have attacked can be doubled. It does not double every hit.',
        '饮用后 30 分钟内，攻击同一目标时，后续伤害有机会加倍；并非每次命中都会触发。',
        '飲用後 30 分鐘內，攻擊同一目標時，後續傷害有機會加倍；並非每次命中都會觸發。'),
    'shrimp_cocktail': triple(
        'Immediately adds 3 experience levels. It is a one-time gain, rather than a lasting experience bonus.',
        '饮用后立即增加 3 级经验，属于一次性获得，不会持续提高经验收益。',
        '飲用後立即增加 3 級經驗，屬於一次性獲得，不會持續提高經驗收益。'),
    'highball': triple(
        'Its original signature is temporary creative flight. Flight is currently unavailable, so this drink will not let you fly.',
        '原有特色是暂时获得创造飞行；目前尚不提供飞行能力，饮用后不能飞行。',
        '原有特色是暫時獲得創造飛行；目前尚不提供飛行能力，飲用後不能飛行。'),
}

FOOD_NOTES = {
    'liangshan_ice_cone': triple('Grants Fire Resistance and Speed for 8 minutes.', '获得抗火与速度，持续 8 分钟。', '獲得抗火與速度，持續 8 分鐘。'),
    'kita_stuffed_crisp': triple('Grants Saturation for 8 minutes, replenishing hunger while the effect lasts.', '获得饱和效果，持续 8 分钟，效果期间会补充饥饿值。', '獲得飽食效果，持續 8 分鐘，效果期間會補充飢餓值。'),
    'pochi_pudding': triple('Grants Regeneration for 8 minutes. Eating it returns the Bowl.', '获得生命恢复，持续 8 分钟；吃完会返还碗。', '獲得生命恢復，持續 8 分鐘；吃完會返還碗。'),
    'magic_crispy_corner': triple('Grants Haste for 8 minutes, helping you mine faster.', '获得急迫，持续 8 分钟，可加快挖掘。', '獲得挖掘加速，持續 8 分鐘，可加快挖掘。'),
}


def guide_body(short, kind, locale, *, mixable=False):
    """Return localized editorial prose; recipe data remains in preparations."""
    def section(heading, text):
        return heading[locale] + '\n' + text[locale]

    if kind in ('bottle', 'cocktail'):
        rows = [section(triple('Character', '饮用特点', '飲用特色'), DRINK_NOTES[short])]
        if kind == 'bottle':
            nonalcoholic = short in ('cool_tea', 'ice_tea', 'kwas_chlebowy', 'sour_plum')
            caution = triple('Low quality can cause Hunger or Weakness.', '低品质会带来饥饿或虚弱。', '低品質會帶來飢餓或虛弱。') if nonalcoholic else triple('Low quality can cause Nausea or Tipsiness.', '低品质容易恶心或微醺。', '低品質容易噁心或微醺。')
            mixer = triple('For cocktails, age it to quality 4 or higher.', '调酒前须熟成至品质 4 以上。', '調酒前須熟成至品質 4 以上。') if mixable else triple('It is for drinking, not a shaker ingredient.', '可直接饮用，不能作为雪克杯原料。', '可直接飲用，不能作為雪克杯原料。')
            rows.append(section(triple('Serving', '取用', '取用'), {lc: caution[lc] + ' ' + mixer[lc] for lc in LOCALES}))
        return '\n\n'.join(rows)

    if kind == 'freezer':
        return '\n\n'.join([
            section(triple('Load and freeze', '放料与冷冻', '放料與冷凍'), triple(
                'Leave space above the lid. Sneak-use to open it, add one matching fluid bucket, then one item per ingredient slot in the shown order. Sneak-use again to close and start. It stays closed while working.',
                '上方留空，潜行互动开盖。先加入一桶对应液体，再按配方槽顺序各放一份材料；再次潜行互动关盖开始。加工中无法打开。',
                '上方留空，潛行互動開蓋。先加入一桶對應液體，再按配方槽順序各放一份材料；再次潛行互動關蓋開始。加工中無法打開。')),
            section(triple('Take or undo', '取出与退料', '取出與退料'), triple(
                'After completion, open and take products one at a time with an empty hand; Pochi Pudding needs a Bowl. Before starting, empty-hand use returns the last ingredient and an empty bucket drains the fluid.',
                '完成后开盖，空手逐个取出成品；波奇布丁须用碗盛出。开始前，空手可退回最后一份原料，空桶可取回液体。',
                '完成後開蓋，空手逐個取出成品；波奇布丁須用碗盛出。開始前，空手可退回最後一份原料，空桶可取回液體。')),
            section(triple('Redstone', '红石', '紅石'), triple(
                'A change to powered opens an idle freezer; losing power closes it and starts a matching batch. A blocked lid cannot open.',
                '通电时可打开空闲冰柜，断电时关盖并开始符合配方的批次；上方被挡住时无法开盖。',
                '通電時可打開閒置冰櫃，斷電時關蓋並開始符合配方的批次；上方被擋住時無法開蓋。')),
            section(triple('Before breaking', '拆除前', '拆除前'), triple(
                'Breaking it drops ingredients still stored inside, but loses fluid, a batch already started, and uncollected products. Drain or collect them first.',
                '拆除会掉出仍存放的原料，但液体、已开始的批次与未取出的成品会损失；请先排空或取完。',
                '拆除會掉出仍存放的原料，但液體、已開始的批次與未取出的成品會損失；請先排空或取完。')),
        ])

    if kind == 'mixer':
        effects = triple('Grants Speed and Haste for 15 seconds.', '获得速度与急迫，持续 15 秒。', '獲得速度與挖掘加速，持續 15 秒。') if short == 'cola' else triple('Grants Regeneration for 15 seconds.', '获得生命恢复，持续 15 秒。', '獲得生命恢復，持續 15 秒。')
        return '\n\n'.join([
            section(triple('Drink', '饮用', '飲用'), {lc: effects[lc] + ' ' + triple('Hold use to drink; Survival drinking returns a Glass Bottle.', '按住使用饮用；生存模式饮用后返还玻璃瓶。', '按住使用飲用；生存模式飲用後返還玻璃瓶。')[lc] for lc in LOCALES}),
            section(triple('Mixology', '调酒', '調酒'), triple('Craft it on a crafting table. It has no aging stages; use one where a recipe calls for it.', '在工作台合成，不需要熟成；配方列出它时，投入一份即可。', '在工作台合成，不需要熟成；配方列出它時，投入一份即可。')),
        ])

    if kind == 'food':
        notes = [section(triple('Eat', '食用', '食用'), {lc: triple('Hold use to eat. ', '按住使用食用。', '按住使用食用。')[lc] + FOOD_NOTES[short][lc] for lc in LOCALES})]
        if short == 'pochi_pudding':
            notes.append(section(triple('Serve', '盛装', '盛裝'), triple('Use a Bowl to take the finished pudding from the freezer; do not add the Bowl as an ingredient.', '用碗从冰柜盛出成品；碗用于取出，不要作为材料放入。', '用碗從冰櫃盛出成品；碗用於取出，不要作為材料放入。')))
        return '\n\n'.join(notes)

    if kind == 'cabinet':
        capacity = triple('Nine slots for compact bottles.', '九格收纳小型酒瓶。', '九格收納小型酒瓶。') if 'cellar' in short else triple('Two slots; a wide bottle occupies both.', '两格收纳酒瓶，宽瓶会独占两格。', '兩格收納酒瓶，寬瓶會獨佔兩格。')
        return '\n\n'.join([
            section(triple('Store and retrieve', '存取', '存取'), {lc: capacity[lc] + ' ' + triple('Use a bottle on the slot you want; empty-hand use retrieves that slot.', '手持酒瓶点击目标格存入，空手点击该格取回。', '手持酒瓶點擊目標格存入，空手點擊該格取回。')[lc] for lc in LOCALES}),
            section(triple('Arrange', '摆放', '擺放'), triple('Matching cabinets connect side by side. Stored bottles keep their quality; breaking the cabinet returns its bottles.', '同款酒柜并排会连接；存入的酒瓶保留品质，拆除时会一并掉出。', '同款酒櫃並排會連接；存入的酒瓶保留品質，拆除時會一併掉出。')),
        ])

    if kind == 'stool':
        return section(triple('Sit', '乘坐', '乘坐'), triple('Empty-hand use while standing to sit. Use your normal dismount control to get up.', '不潜行时空手互动即可坐下；使用平常的下坐骑操作起身。', '不潛行時空手互動即可坐下；使用平常的下坐騎操作起身。'))
    if kind == 'painting':
        return section(triple('Display', '陈设', '陳設'), triple('Use it on a supporting surface to place it. Breaking the painting or removing its support drops the painting.', '对支撑表面使用即可摆放；破坏挂画或移除支撑会掉出挂画。', '對支撐表面使用即可擺放；破壞掛畫或移除支撐會掉出掛畫。'))
    if kind == 'record':
        return '\n\n'.join([
            section(triple('Play', '播放', '播放'), triple('Use on an empty jukebox to play one of its two tracks at random. Empty-hand use stops playback and returns the disc.', '对空唱片机使用，随机播放两首曲目之一；空手互动停止播放并取回唱片。', '對空唱片機使用，隨機播放兩首曲目之一；空手互動停止播放並取回唱片。')),
            section(triple('Wall display', '挂墙', '掛牆'), triple('Sneak-use on a wall to hang it; empty-hand use takes it back. Removing its support also drops the disc.', '潜行对墙面使用可悬挂；空手互动可取回，移除支撑也会掉出唱片。', '潛行對牆面使用可懸掛；空手互動可取回，移除支撐也會掉出唱片。')),
        ])
    raise ValueError('Missing guide copy: ' + kind + '/' + short)
