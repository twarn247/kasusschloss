/* Heute's daily session, built from the unit graph (ROADMAP.md section 5). The plan is fixed for the day once built. */
import {today} from "./core.js";
import {S,save} from "./store.js";
import {UNITS,BY_ID,hasContent,specs,days} from "./units.js";

const DONE=new Set(["working","fluent","retained"]);
const st=id=>S.units[id]&&S.units[id].state;

function build(){
  const t=today(),rounds=[];
  const active=UNITS.filter(u=>hasContent(u)&&st(u.id)&&st(u.id)!=="locked");
  /* 1. retention checks: fluent for 3+ days; a 1-minute sprint of only that unit decides retained */
  const due=active.filter(u=>st(u.id)==="fluent"&&S.units[u.id].fluentAt&&days(S.units[u.id].fluentAt,t)>=3);
  for(const u of due){const s=specs.find(s=>s.units.includes(u.id)),r=s.round([u.id]);
    rounds.push({mod:s.name,cfg:r.cfg,kind:"check",units:[u.id],label:"Retention check · "+r.label,
      why:`${u.id} has been fluent since ${S.units[u.id].fluentAt}. Stay at the aim today and it becomes retained.`});}
  /* 2. practice: one mixed round per drill, weak items first (the scheduler's 2 strong : 1 weak);
        diagnosed gaps first; retained units only get a round when nothing else in that drill needs work */
  const groups=specs.map(s=>{const ids=s.units.filter(id=>active.some(u=>u.id===id));
    const work=ids.filter(id=>st(id)!=="retained"&&!due.some(u=>u.id===id));
    return{s,ids:work.length?work:ids.filter(id=>!due.some(u=>u.id===id)),maint:!work.length};}).filter(g=>g.ids.length);
  const gap=g=>g.ids.some(id=>BY_ID.get(id).tags.includes("diagnosed-gap"));
  groups.sort((a,b)=>gap(b)-gap(a));
  for(const g of groups){const r=g.s.round(g.ids,{allWorking:g.ids.every(id=>DONE.has(st(id)))});
    const names=g.ids.map(id=>id+" ("+st(id)+")").join(", ");
    rounds.push({mod:g.s.name,cfg:r.cfg,kind:g.maint?"maintenance":"practice",units:g.ids,label:r.label,
      why:g.maint?`Light review: ${names}.`:`${names}. Weak items come up more often, between easier ones.`});}
  return rounds;
}
export function todaysPlan(){
  const t=today();
  if(!S.session||S.session.d!==t){S.session={d:t,rounds:build(),i:0};save();}
  return S.session;
}
/* run round i; onDone(resultPanel) fires when its clock runs out */
export function runRound(i,onDone){
  const p=todaysPlan(),r=p.rounds[i],s=specs.find(s=>s.name===r.mod);
  s.start(r.cfg,panel=>{if(p.i<=i){p.i=i+1;save();}onDone(panel);});
}
