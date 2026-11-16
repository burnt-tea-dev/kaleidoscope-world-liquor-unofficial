"""Base item tags shared by the Java converter and mixology updater."""
import json

NS='kaleidoscope_world_liquor';KT='kaleidoscope_tavern'

def load_alcohol_items(root):
    path=root/'upstream/data'/KT/'tags/item/alcohol.json'
    return {item for item in json.loads(path.read_text(encoding='utf-8-sig'))['values']
            if item.startswith(NS+':')}

def base_item_tags(item,kind,alcohol_items):
    return [KT+':alcohol'] if kind=='bottle' and item.rsplit('_q',1)[0] in alcohol_items else []
