/* Saved progress. Never break it: see "Never break saved progress" in CLAUDE.md. */
import {median} from "./core.js";

const KEY="kasusschloss-v2";
const blank=()=>({it:{},hist:[],fade:{},cold:[]});

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

/* item stats: last 10 outcomes {o:1|0, r:ms} */
export function rec(k,ok,rt){const h=S.it[k]||(S.it[k]=[]);h.push({o:ok?1:0,r:Math.round(rt)});if(h.length>10)h.shift();}
export function itemMed(k){const h=S.it[k]||[];return median(h.filter(x=>x.o).map(x=>x.r));}
export function itemErr(k){const h=S.it[k]||[];return h.length?h.filter(x=>!x.o).length/h.length:0;}
