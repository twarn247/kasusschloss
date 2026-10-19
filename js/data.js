/* Content lives in data/*.json. Every file loaded here must be in CORE in sw.js. */
async function load(name){
  const r=await fetch(new URL("../data/"+name+".json",import.meta.url));
  if(!r.ok)throw new Error("data/"+name+".json: HTTP "+r.status);
  return r.json();
}
export const [REKTION,KASUS]=await Promise.all([load("rektion"),load("kasus")]);
