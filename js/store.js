/* Saved progress. Never break it: see "Never break saved progress" in CLAUDE.md. */
import {median,today} from "./core.js";

const KEY="kasusschloss-v2";
/* schema 3 adds log, base, seq, units; older data and exports simply lack them (see js/units.js migrate) */
const blank=()=>({it:{},hist:[],fade:{},cold:[],log:{},base:{},seq:{},units:{}});

/* S is one shared object for the whole app; replaceState() swaps its contents in place */
export const S=blank();
try{const r=localStorage.getItem(KEY);if(r)Object.assign(S,JSON.parse(r));
  else{const old=localStorage.getItem("kasusschloss-v1");if(old){const o=JSON.parse(old);S.fade=o.fade||{};S.cold=o.cold||[];}}}catch(e){}
export function save(){try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}}

const listeners=[];
/* re-render hook for anything that shows S after a reset or import */
export function onReplace(fn){listeners.push(fn);}
export function replaceState(o){
  for(const k of Object.keys(S))delete S[k];
  Object.assign(S,blank(),o);save();listeners.forEach(fn=>fn());
}
export function exportJSON(){return JSON.stringify(S);}
/* throws if the text isn't a Kasusschloss export */
export function importJSON(text){const o=JSON.parse(text);if(!o||typeof o!=="object"||!("it" in o))throw 0;replaceState(o);}

/* history row per item per day: [tries, wrong, summed ms of right answers (each capped at 10 s)] */
export const RT_CAP=10000;
export function addRow(rows,k,ok,rt){const r=rows[k]||(rows[k]=[0,0,0]);r[0]++;if(!ok)r[1]++;else r[2]+=Math.min(Math.round(rt),RT_CAP);}
/* every scored answer: item stats (last 10), daily history, and the unit's last 20 outcomes */
export function rec(k,ok,rt,unit){
  const h=S.it[k]||(S.it[k]=[]);h.push({o:ok?1:0,r:Math.round(rt)});if(h.length>10)h.shift();
  const d=today();addRow(S.log[d]||(S.log[d]={}),k,ok,rt);
  if(unit){const s=S.seq[unit]||(S.seq[unit]=[]);s.push(ok?1:0);if(s.length>20)s.shift();(S.units[unit]||(S.units[unit]={})).last=d;}
}
export function itemMed(k){const h=S.it[k]||[];return median(h.filter(x=>x.o).map(x=>x.r));}
export function itemErr(k){const h=S.it[k]||[];return h.length?h.filter(x=>!x.o).length/h.length:0;}
