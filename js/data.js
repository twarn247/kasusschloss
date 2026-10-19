/* Content lives in data/*.json; the unit graph in curriculum.json. Every file loaded here must be in CORE in sw.js. */
async function load(path){
  const r=await fetch(new URL("../"+path,import.meta.url));
  if(!r.ok)throw new Error(path+": HTTP "+r.status);
  return r.json();
}
export const [REKTION,KASUS,CURRICULUM]=await Promise.all([load("data/rektion.json"),load("data/kasus.json"),load("curriculum.json")]);
