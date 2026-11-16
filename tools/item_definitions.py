"""Pure item definition used by the normal Java converter."""
from item_base_tags import base_item_tags
from item_names import tooltip_key

NS = 'kaleidoscope_world_liquor'
KT = 'kaleidoscope_tavern'


def item_definition(item, kind, tex, alcohol_items, category):
    name_key='item.'+item+'.name'
    c={'minecraft:display_name':{'value':name_key if kind=='bottle' else tooltip_key(name_key)},'minecraft:icon':tex,'minecraft:max_stack_size':16 if kind in ['bottle','cocktail','drink'] else 64}
    tags=base_item_tags(item,kind,alcohol_items)
    if tags:c['minecraft:tags']={'tags':tags}
    if kind in ['bottle','cocktail','drink']:
     c.update({'minecraft:use_animation':'drink','minecraft:use_modifiers':{'use_duration':1.6,'movement_modifier':.35,'start_using':'if_first'},KT+':drink_effects' if kind=='bottle' else KT+':cocktail_effects' if kind=='cocktail' else NS+':consume':{}})
    elif kind=='block':c['minecraft:block_placer']={'block':item,'replace_block_item':True}
    # Only the owner's explicit Java representatives are creative entry points.
    description={'identifier':item}
    if category:description['menu_category']=category
    d={'format_version':'1.26.50','minecraft:item':{'description':description,'components':c}}
    return d
