const here=new URL('.',import.meta.url);
export async function resolve(specifier,context,next){
 if(specifier==='@minecraft/server')return {url:new URL('wall-record-mock.mjs',here).href,shortCircuit:true};
 if(context.parentURL?.endsWith('/furniture.js')&&['./foundation.js','./record-audio.js','./freezer-visuals.js'].includes(specifier))return {url:new URL('wall-record-deps.mjs',here).href,shortCircuit:true};
 return next(specifier,context);
}
