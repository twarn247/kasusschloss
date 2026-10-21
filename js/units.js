/* Unit states from curriculum.json: locked / open / working / fluent / retained / assumed.
   The rules come from curriculum.mastery and curriculum.learner; see ROADMAP.md section 1. */
import {today} from "./core.js";
import {CURRICULUM as C} from "./data.js";
import {S,save,addRow,onReplace} from "./store.js";

export {C as CURRICULUM};
export const UNITS=C.units.slice().sort((a,b)=>a.sequence-b.sequence);
export const BY_ID=new Map(UNITS.map(u=>[u.id,u]));
const HAS=new Set(C.learner.already_in_app);              // units with content in the app
const lv=l=>C.levels.indexOf(l),PLACE=lv(C.learner.placement_level);
const SAT=new Set(["working","fluent","retained","assumed"]);
export const hasContent=u=>HAS.has(u.id);
export const isAssumed=u=>!HAS.has(u.id)&&lv(u.level)<=PLACE&&!u.tags.includes("diagnosed-gap");

/* Drill modules register how their items and sprints map to units:
   name; units: the unit ids it drills; unitOf(itemKey) -> unit id or null; label(itemKey) -> display text;
   sprintAim[unit](histRow) -> rate aim if the row is a 1-minute sprint of only that unit, else null;
   target(itemKey) -> speed target in ms; round(unitIds) -> {cfg,label} for one session round over those units; start(cfg,onDone) runs it */
export const specs=[];
export function register(spec){specs.push(spec);}
export const unitOf=k=>{for(const s of specs){const u=s.unitOf(k);if(u)return u;}return null;};
export const itemLabel=k=>{for(const s of specs){const l=s.label&&s.label(k);if(l)return l;}return k;};
/* the drill's per-answer speed target for this item (the same one repair mode uses) */
export const itemTarget=k=>{for(const s of specs){const t=s.target&&s.target(k);if(t)return t;}return null;};

export function accuracy(id){const s=S.seq[id]||[];return{n:s.length,right:s.reduce((a,b)=>a+b,0)};}
/* the most recent 1-minute sprint of only this unit, with its aim */
export function lastSprint(id){
  for(let i=S.hist.length-1;i>=0;i--){const h=S.hist[i];
    for(const s of specs){const f=s.sprintAim&&s.sprintAim[id],aim=f&&f(h);if(aim!=null)return{row:h,aim,rate:h.c/(h.secs/60)};}}
  return null;
}
function perf(u){
  const {n,right}=accuracy(u.id);
  if(n<20||right/n<0.85)return"open";
  if(!u.content_complete)return"working";            // partial units are capped at working
  const sp=lastSprint(u.id);
  return right/n>=0.95&&sp&&sp.rate>=sp.aim?"fluent":"working";
}
export const days=(a,b)=>Math.round((Date.parse(b)-Date.parse(a))/864e5);

export function evaluate(){
  const t=today();
  for(const u of UNITS){
    const r=S.units[u.id]||(S.units[u.id]={});
    let st;
    if(isAssumed(u))st="assumed";
    else{
      if(!r.unlockedAt&&u.requires.every(id=>S.units[id]&&SAT.has(S.units[id].state)))r.unlockedAt=t;
      if(!r.unlockedAt)st="locked";                  // once unlocked, never re-locked
      else if(!HAS.has(u.id))st="open";              // unlocked, no content yet
      else{
        const p=perf(u);
        if(p!=="fluent")st=p;
        else if(r.state==="retained")st="retained";
        else if(r.state==="fluent"&&r.fluentAt&&days(r.fluentAt,t)>=3&&r.last===t){st="retained";r.retainedAt=t;}
        else{st="fluent";if(r.state!=="fluent")r.fluentAt=t;}
      }
    }
    if(r.state!==st){r.state=st;r.since=t;}
  }
  save();
}

/* Data saved before schema 3 (or an old export): seed history from the last-10 item stats.
   S.it has no dates and no order across items, so the seeded unit outcomes are interleaved round-robin. */
function migrate(){
  if((S.schema||0)>=3)return;
  const t=today(),per={};
  for(const [k,h] of Object.entries(S.it)){
    for(const x of h)addRow(S.base,k,x.o,x.r);
    const u=unitOf(k);if(u)(per[u]||(per[u]=[])).push(h.map(x=>x.o));
  }
  for(const [u,lists] of Object.entries(per)){
    const m=Math.max(...lists.map(l=>l.length)),out=[];
    for(let i=0;i<m;i++)for(const l of lists){const j=l.length-m+i;if(j>=0)out.push(l[j]);}
    S.seq[u]=out.slice(-20);
  }
  for(const id of HAS){const r=S.units[id]||(S.units[id]={});if(!r.unlockedAt)r.unlockedAt=t;}   // already playable: stays unlocked
  S.schema=3;
}

export function initUnits(){migrate();evaluate();onReplace(()=>{migrate();evaluate();});}
