/* Which item comes next. Shared by every timed drill. */
import {pick} from "./core.js";
import {S,itemMed,itemErr} from "./store.js";

export function weakness(k){const h=S.it[k]||[];const m=itemMed(k);return (m==null?1600:m)+itemErr(k)*1500+(h.length<3?400:0);}

/* High-probability sequencing: two strong items, then one weak; unseen items first.
   Repair mode alternates a target (st.need[id]>0) with an item outside the repair set.
   st: {repair, pool, need, n, cur, seen}; all: the drill's full item list;
   fallback: where to look if src has nothing but the current item;
   id(x): stable item id; wkey(x): the S.it key for weakness(). */
export function nextItem(st,{all,fallback,id,wkey}){
  let src;
  if(st.repair){
    const targets=st.pool.filter(x=>st.need[id(x)]>0);
    src=(st.n%2===1)?targets:all.filter(x=>!(id(x) in st.need));
    if(!src.length)src=targets;
  }else{
    const ranked=all.slice().sort((a,b)=>weakness(wkey(b))-weakness(wkey(a)));
    const cut=Math.max(1,Math.ceil(ranked.length/3));
    src=(st.n%3===2)?ranked.slice(0,cut):ranked.slice(cut);
  }
  const cur=st.cur&&id(st.cur);
  let cand=src.filter(x=>id(x)!==cur);if(!cand.length)cand=fallback.filter(x=>id(x)!==cur);
  if(!st.repair){const un=cand.filter(x=>!st.seen.has(id(x)));if(un.length)cand=un;if(st.seen.size>=all.length)st.seen.clear();}
  st.n++;return pick(cand);
}
