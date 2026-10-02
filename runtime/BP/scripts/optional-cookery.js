/** Known optional rice recipes only. Never relax the Tavern item validator. */
const NS='kaleidoscope_world_liquor:';
export const OPTIONAL_COOKERY_RECIPES=Object.freeze([
 Object.freeze({recipe:NS+'barrel/dassai',page:NS+'guide/dassai',item:'kaleidoscope_cookery:rice',names:{en_US:'Cookery rice',zh_CN:'森罗厨房的大米',zh_TW:'森羅廚房的米'}}),
 Object.freeze({recipe:NS+'barrel/maotai',page:NS+'guide/maotai',item:'kaleidoscope_cookery:rice_panicle',names:{en_US:'Cookery rice panicle',zh_CN:'森罗厨房的水稻',zh_TW:'森羅廚房的稻穗'}})
]);
export function buildRegistrationPayload(payload,itemExists){
 const missing=OPTIONAL_COOKERY_RECIPES.filter(rule=>payload.recipes.some(r=>r.id===rule.recipe)&&!itemExists(rule.item));
 if(!missing.length)return payload;
 const output=JSON.parse(JSON.stringify(payload)),disabled=new Set(missing.map(r=>r.recipe));
 output.recipes=output.recipes.filter(r=>!disabled.has(r.id));
 for(const page of output.pages??[]){
  if(Array.isArray(page.recipeIds))page.recipeIds=page.recipeIds.filter(id=>!disabled.has(id));
  const rule=missing.find(r=>r.page===page.id);if(!rule)continue;
  if(Array.isArray(page.preparations))page.preparations=page.preparations.filter(r=>!(r.method==='Barrel'&&r.ingredients?.includes(rule.item)));
  const notice={en_US:'The original rice brewing recipe requires optional '+rule.names.en_US+' and is unavailable in this pack stack. Existing bottles remain drinkable and placeable; drinking returns an empty Tavern bottle and retains their effects.',zh_CN:'原版米类酿造配方需要可选的'+rule.names.zh_CN+'，当前组合不提供这条配方；已有酒瓶仍可饮用、摆放，饮用后返还酒馆空瓶，效果保留。',zh_TW:'原版米類釀造配方需要可選的'+rule.names.zh_TW+'，目前組合不提供這條配方；已有酒瓶仍可飲用、擺放，飲用後返還酒館空瓶，效果保留。'};
  page.body={...page.body};for(const [locale,text] of Object.entries(notice))page.body[locale]=text+'\n'+(page.body[locale]??page.body.en_US??'');
 }
 return output;
}
