/* What improved and what is still weak, from the daily history (S.log) and the pre-schema-3 baseline (S.base).
   "Improved" means speed plus accuracy: fewer errors or clearly faster, and never more errors than before. */
import {S,itemMed,itemErr} from "./store.js";
import {weakness} from "./scheduler.js";
import {UNITS,unitOf,itemLabel,itemTarget,hasContent} from "./units.js";

const ITEM_MIN=6,UNIT_MIN=30;                 // answers needed in each window

/* chronological rows [tries, wrong, ms of right answers] for whatever keys pass the filter, one per day */
function series(match){
  const rows=[],add=(d,src)=>{let r=null;for(const [k,v] of Object.entries(src))if(match(k)){r=r||[0,0,0];r[0]+=v[0];r[1]+=v[1];r[2]+=v[2];}if(r)rows.push({d,r});};
  add(null,S.base);for(const d of Object.keys(S.log).sort())add(d,S.log[d]);
  return rows;
}
function agg(rows){const t=[0,0,0];rows.forEach(({r})=>{t[0]+=r[0];t[1]+=r[1];t[2]+=r[2];});
  return{tries:t[0],err:t[1]/t[0],ms:t[0]>t[1]?t[2]/(t[0]-t[1]):null,from:rows[0].d,to:rows[rows.length-1].d};}
/* earliest rows with at least min answers vs latest rows with at least min answers; null unless they don't overlap */
function windows(rows,min){
  let n=0,i=0;for(;i<rows.length&&n<min;i++)n+=rows[i].r[0];if(n<min)return null;
  let m=0,j=rows.length-1;for(;j>=i&&m<min;j--)m+=rows[j].r[0];if(m<min)return null;
  return{then:agg(rows.slice(0,i)),now:agg(rows.slice(j+1))};
}
function improved(w){
  if(!w)return false;const{then:a,now:b}=w;
  if(b.err>a.err+0.05)return false;
  return a.err-b.err>=0.15||(a.ms!=null&&b.ms!=null&&b.ms<=a.ms*0.85);
}
const thenWeak=w=>w.then.err*1500+(w.then.ms||1600);

export function improvements(){
  const keys=new Set(Object.keys(S.base));Object.values(S.log).forEach(day=>Object.keys(day).forEach(k=>keys.add(k)));
  const items=[...keys].map(k=>({k,label:itemLabel(k),unit:unitOf(k),w:windows(series(x=>x===k),ITEM_MIN)}))
    .filter(x=>improved(x.w)).sort((a,b)=>thenWeak(b.w)-thenWeak(a.w));
  const units=UNITS.filter(hasContent).map(u=>({u,w:windows(series(k=>unitOf(k)===u.id),UNIT_MIN)})).filter(x=>improved(x.w));
  return{items,units};
}
/* weakest items right now, seen at least 3 times and missing the bar: 10%+ wrong, or a median slower than the drill's target */
export function weakNow(n){
  const behind=k=>{const m=itemMed(k),t=itemTarget(k);return itemErr(k)>=0.1||m==null||(t!=null&&m>=t);};
  return Object.keys(S.it).filter(k=>unitOf(k)&&S.it[k].length>=3&&behind(k)).sort((a,b)=>weakness(b)-weakness(a)).slice(0,n)
    .map(k=>({k,label:itemLabel(k),unit:unitOf(k),ms:itemMed(k),err:itemErr(k)}));
}
