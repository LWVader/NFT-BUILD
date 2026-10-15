const fs = require('fs');
const path = require('path');
const characters = require('../src/characters.json');
const tiers = [
  {name:'Common',cap:30},{name:'Uncommon',cap:12},
  {name:'Rare',cap:6},{name:'Legendary',cap:2}
];
const base = process.env.ASSET_BASE_URI;
const animation = process.env.ANIMATION_BASE_URI;
if (!base || !base.endsWith('/')) throw new Error('Set ASSET_BASE_URI to a pinned asset directory ending in /');
if (characters.length !== 52 || new Set(characters.map(c=>c.id)).size !== 52 || characters.some((c,i)=>c.id !== i+1)) {
  throw new Error('Supply exactly 52 ordered, unique characters before producing production metadata.');
}
const out = path.resolve(__dirname,'../metadata');
fs.mkdirSync(out,{recursive:true});
for(const character of characters) {
  if (!character.name || !character.description || !character.image) throw new Error('Incomplete character '+character.id);
  for(let tier=0;tier<4;tier++) {
    const id=(character.id-1)*4+tier+1;
    const t=tiers[tier];
    const imageName=path.basename(character.image);
    const data={
      name:`THE FEEDERS #${String(character.id).padStart(2,'0')} ${character.name} — ${t.name}`,
      description:`${character.description} THE FEEDERS Genesis edition. Maximum supply: ${t.cap}.`,
      image:base+imageName,
      ...(animation ? {animation_url:animation+`${id}/`} : {}),
      attributes:[{trait_type:'Character',value:character.name},{trait_type:'Character Number',value:character.id},{trait_type:'Rarity',value:t.name},{trait_type:'Edition Cap',value:t.cap},{trait_type:'Creator',value:'LWVADER'}]
    };
    fs.writeFileSync(path.join(out,`${id}.json`),JSON.stringify(data,null,2)+'\n');
  }
}
console.log('Generated 208 metadata files. Pin the directory and set METADATA_BASE_URI.');
