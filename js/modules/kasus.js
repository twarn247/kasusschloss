/* Case sprint, Fade and Cold check. Content: data/kasus.json. */
import {$,pick,median,norm,today,CV,CNAME,GNAME,ui,seg,pressSeg} from "../core.js";
import {KASUS} from "../data.js";
import {S,save,rec,itemMed,onReplace,replaceState} from "../store.js";
import {nextItem} from "../scheduler.js";
import {register,evaluate} from "../units.js";

const PREPS=KASUS.preps,ART=KASUS.articles,NOUNS=KASUS.nouns;
const UNIT=KASUS.units;
const PREP_ITEMS=[];for(const c in PREPS)for(const p of PREPS[c])PREP_ITEMS.push({k:"p:"+p,c,label:p,show:()=>p,phrase:false,unit:UNIT.preps});
const PHRASE_ITEMS=KASUS.slots.map(({form:f,gender:g,case:c})=>({k:"a:"+f+"-"+g,c,label:f+" ("+(g==="p"?"pl":g)+")",phrase:true,unit:UNIT.articles,
  show:()=>{if(g==="p"){const n=pick(NOUNS.p);return f+" "+(c==="D"?n[1]:n[0]);}return f+" "+pick(NOUNS[g]);}}));
export const DECKS={prep:PREP_ITEMS,phrase:PHRASE_ITEMS,mixed:PREP_ITEMS.concat(PHRASE_ITEMS)};
export const AIM={prep:45,phrase:35,mixed:35};       // correct per minute, starting aims
export const TARGET_MS={prep:900,phrase:1100,mixed:1000};
/* a 1-minute sprint of one deck counts toward that deck's unit rate aim; Mixed and Scrambled don't */
const oneMinute=(h,deck)=>h.deck===deck&&h.cond==="min"&&h.secs===60;
const LABEL=new Map(PREP_ITEMS.concat(PHRASE_ITEMS).map(x=>[x.k,x.label]));
const DECK_NAME={prep:"prepositions",phrase:"article phrases",mixed:"prepositions + article phrases"};
register({name:"kasus",units:[UNIT.preps,UNIT.articles],
  unitOf:k=>k.startsWith("p:")?UNIT.preps:k.startsWith("a:")?UNIT.articles:null,label:k=>LABEL.get(k),
  target:k=>k.startsWith("p:")?TARGET_MS.prep:k.startsWith("a:")?TARGET_MS.phrase:null,
  round:ids=>{const deck=ids.length>1?"mixed":ids[0]===UNIT.preps?"prep":"phrase";return{cfg:{deck},label:"Case sprint · "+DECK_NAME[deck]};},
  start:(cfg,onDone)=>startRound(cfg,onDone),
  sprintAim:{[UNIT.preps]:h=>oneMinute(h,"prep")?AIM.prep:null,[UNIT.articles]:h=>oneMinute(h,"phrase")?AIM.phrase:null}});

/* ---------- SPRINT ---------- */
let cfg={deck:"prep",cond:"min"};
let sp={on:false};
seg("segDeck",v=>{cfg.deck=v;abort();idle();});
seg("segCond",v=>{cfg.cond=v;abort();idle();});
function idle(){
  $("btnW").hidden=cfg.deck==="phrase";
  $("word").textContent="bereit";$("word").style.cssText="";$("word").className="big";$("verdict").textContent="";
  $("hudT").textContent=(cfg.cond==="endure"?180:60)+"s";$("hudC").textContent="0 right";$("hudE").textContent="0 wrong";
  $("clockBar").style.width="100%";$("startRow").hidden=false;$("result").hidden=true;$("hands").hidden=false;
  $("go").textContent="Start sprint";
}
function show(){
  const all=DECKS[cfg.deck];
  sp.cur=nextItem(sp,{all,fallback:sp.repair?sp.pool:all,id:x=>x.k,wkey:x=>x.k});sp.seen&&sp.seen.add(sp.cur.k);
  const w=$("word");w.textContent=sp.cur.show();w.className="big"+(sp.cur.phrase?" phrase":"");
  if(cfg.cond==="stroop"&&!sp.repair){
    w.style.color=pick([CV.A,CV.D,CV.W]);
    const s=0.75+Math.random()*0.4,dx=(Math.random()-.5)*90,dy=(Math.random()-.5)*36;
    w.style.transform=`translate(${dx}px,${dy}px) scale(${s})`;
  }else{w.style.color="var(--ink)";w.style.transform="";}
  $("verdict").textContent="";sp.t0=performance.now();sp.lock=false;
}
/* one round of Heute's session: a normal timed sprint; onDone gets the result panel when the clock runs out */
export function startRound({deck},onDone){pressSeg("segDeck",deck);pressSeg("segCond","min");start(null,onDone);}
function start(repair,round){
  const secs=cfg.cond==="endure"?180:60;
  sp={on:true,repair:!!repair,round:round||null,secs,c:0,e:0,rts:[],errs:[],n:0,cur:null,seen:new Set(),lock:false,pool:null,need:null};
  if(repair){sp.pool=repair;sp.need={};repair.forEach(x=>sp.need[x.k]=2);}
  $("startRow").hidden=true;$("result").hidden=true;$("hands").hidden=false;$("btnW").hidden=cfg.deck==="phrase";
  sp.end=performance.now()+secs*1000;
  if(!repair){loop();}else{$("hudT").textContent="repair";$("clockBar").style.width="100%";}
  hud();show();
}
function loop(){
  if(!sp.on||sp.repair)return;
  const left=sp.end-performance.now();
  $("clockBar").style.width=Math.max(0,left/(sp.secs*1000)*100)+"%";
  $("hudT").textContent=Math.max(0,Math.ceil(left/1000))+"s";
  if(left<=0){finish();return;}
  sp.raf=requestAnimationFrame(loop);
}
function hud(){
  if(sp.repair){const left=Object.values(sp.need).filter(v=>v>0).length;$("hudC").textContent=left+" to clear";$("hudE").textContent=sp.e+" wrong";return;}
  $("hudC").textContent=sp.c+" right";$("hudE").textContent=sp.e+" wrong";
}
function answer(c){
  if(!sp.on||sp.lock||!sp.cur)return;
  const rt=performance.now()-sp.t0,it=sp.cur,ok=c===it.c;
  rec(it.k,ok,rt,it.unit);
  if(sp.repair&&it.k in sp.need){
    if(ok&&rt<TARGET_MS[cfg.deck])sp.need[it.k]--;else sp.need[it.k]=2;
  }
  if(ok){
    sp.c++;sp.rts.push(rt);$("word").style.color=CV[it.c];
    $("verdict").innerHTML=sp.repair&&it.k in sp.need?`<span class="muted">${Math.round(rt)} ms${rt>=TARGET_MS[cfg.deck]?", too slow, counts as a reset":""}</span>`:"";
    sp.lock=true;
    if(sp.repair&&Object.values(sp.need).every(v=>v<=0)){save();setTimeout(repairDone,250);return;}
    setTimeout(show,sp.repair?260:110);
  }else{
    sp.e++;sp.errs.push({it,shown:$("word").textContent,c});
    $("word").style.color=CV[it.c];
    $("verdict").innerHTML=`<span class="tag ${it.c}">${CNAME[it.c]}</span>`;
    sp.lock=true;setTimeout(show,800);
  }
  hud();
}
export function abort(){if(sp.on){sp.on=false;cancelAnimationFrame(sp.raf);}}
function finish(){
  abort();save();
  const mins=sp.secs/60,rate=sp.c/mins,erate=sp.e/mins,med=median(sp.rts);
  S.hist.push({d:today(),deck:cfg.deck,cond:cfg.cond,secs:sp.secs,c:sp.c,e:sp.e,med:med?Math.round(med):null});evaluate();
  const pool=DECKS[cfg.deck];
  const slow=pool.filter(x=>itemMed(x.k)!=null).sort((a,b)=>itemMed(b.k)-itemMed(a.k)).slice(0,5);
  const missed=[...new Map(sp.errs.map(e=>[e.it.k,e])).values()];
  let endureNote="";
  if(cfg.cond==="endure"){
    const mins1=S.hist.filter(h=>h.deck===cfg.deck&&h.cond==="min");
    if(mins1.length){const best=Math.max(...mins1.slice(-5).map(h=>h.c));
      endureNote=`<p>Your recent best 1-minute rate is ${best}. ${rate>=best*0.9?"You held it for three minutes: that is endurance.":"Your rate sagged over three minutes; keep building the 1-minute rate before pushing length."}</p>`;}
  }
  const aim=AIM[cfg.deck];
  $("word").textContent=rate>=aim&&sp.e<=1?"flüssig":Math.round(rate)+"/min";$("word").style.cssText="";$("word").className="big";
  $("word").style.color=rate>=aim&&sp.e<=1?"var(--ok)":"var(--ink)";$("verdict").textContent="";
  $("hands").hidden=true;
  $("result").innerHTML=`
    <div class="kpis">
      <div class="kpi"><b>${Math.round(rate)}</b><span>correct per minute, aim ${aim}</span></div>
      <div class="kpi"><b>${erate.toFixed(erate<10?1:0)}</b><span>errors per minute, aim 1 or fewer</span></div>
      <div class="kpi"><b>${med?Math.round(med):"–"}</b><span>median ms per right answer</span></div>
    </div>
    ${endureNote}
    ${missed.length?`<h3>Missed</h3><div class="misslist">${missed.map(m=>`<span>${m.shown} <span class="tag ${m.it.c}">${CNAME[m.it.c]}</span></span>`).join("")}</div>`:""}
    ${slow.length?`<h3>Slowest right now</h3><div class="misslist">${slow.map(x=>`<span>${x.label} ${Math.round(itemMed(x.k))} ms</span>`).join("")}</div>`:""}
    <div class="row">
      <button class="btn" id="again">Sprint again</button>
      ${(missed.length||slow.length)?`<button class="btn ghost" id="repair">Repair these ${new Set(missed.map(m=>m.it.k).concat(slow.map(s=>s.k))).size}</button>`:""}
    </div>
    <p class="muted" style="font-size:14px">Repair cycles only these items between easy ones until each is answered right twice in a row under ${TARGET_MS[cfg.deck]} ms. No clock, no rate logged.</p>`;
  $("result").hidden=false;
  $("again").onclick=()=>start();
  const rb=$("repair");
  if(rb){const keys=new Set(missed.map(m=>m.it.k).concat(slow.map(s=>s.k)));rb.onclick=()=>start(pool.filter(x=>keys.has(x.k)));}
  if(sp.round)sp.round($("result"));
}
function repairDone(){
  sp.on=false;evaluate();$("word").textContent="repariert";$("word").style.color="var(--ok)";$("hands").hidden=true;
  $("verdict").textContent="";$("result").innerHTML=`<div class="row" style="justify-content:center"><button class="btn" id="again2">Run a timed sprint</button></div>`;
  $("result").hidden=false;$("again2").onclick=()=>start();
}
$("go").onclick=()=>start();
document.querySelectorAll("#hands button").forEach(b=>b.addEventListener("pointerdown",e=>{e.preventDefault();answer(b.dataset.c);}));
document.addEventListener("keydown",e=>{
  if(ui.active!=="sprint"||e.target.tagName==="INPUT"||e.repeat)return;
  const k=e.key.toLowerCase();
  if(!sp.on){if(e.key==="Enter"){e.preventDefault();start();}return;}
  if(k==="f"){e.preventDefault();answer("A");}
  else if(k==="j"){e.preventDefault();answer("D");}
  else if(e.key===" "){e.preventDefault();if(cfg.deck!=="phrase")answer("W");}
});

/* ---------- FADE ---------- */
const FADE=KASUS.fade.map(({id,label,text,case:c})=>({id,label,text,c}));
function seeded(seed){let x=0;for(const ch of seed)x=(x*31+ch.charCodeAt(0))>>>0;return()=>{x=(x*1664525+1013904223)>>>0;return x/4294967296;};}
function mask(text,lvl,id){if(lvl>=5)return"· · ·";const r=seeded(id+lvl),frac=[0,.35,.65,1,1][lvl];
  return text.split(" ").map(w=>lvl===4?"_".repeat(w.length):[...w].map((ch,i)=>i===0?ch:(r()<frac?"_":ch)).join("")).join(" ");}
let fadeCur=null;
function chooseFade(){const min=Math.min(...FADE.map(f=>S.fade[f.id]||0));const pool=FADE.filter(f=>(S.fade[f.id]||0)<=min+1&&f!==fadeCur);fadeCur=pick(pool.length?pool:FADE);}
export function renderFade(){if(!fadeCur)chooseFade();
  $("fadePips").innerHTML=FADE.map(f=>`<span class="pip"><span class="tag ${f.c}" style="padding:0 6px">${f.label.split(",")[0]}</span> <b>${S.fade[f.id]||0}</b>/5</span>`).join("");
  const lvl=S.fade[fadeCur.id]||0;$("fadeLabel").innerHTML=`<span class="tag ${fadeCur.c}">${fadeCur.label}</span> <span class="muted">level ${lvl}</span>`;
  $("fadeMask").textContent=mask(fadeCur.text,lvl,fadeCur.id);$("fadeMask").style.color=CV[fadeCur.c];}
function checkFade(){const v=$("fadeIn").value;if(!v.trim())return;const lvl=S.fade[fadeCur.id]||0;
  if(norm(v)===norm(fadeCur.text)){S.fade[fadeCur.id]=Math.min(5,lvl+1);$("fadeFb").innerHTML=`<span class="ok">Right. Level ${S.fade[fadeCur.id]}.</span>`;save();$("fadeIn").value="";chooseFade();renderFade();}
  else{S.fade[fadeCur.id]=Math.max(0,lvl-1);save();$("fadeFb").innerHTML=`<span class="bad">It is: <b>${fadeCur.text}</b>. Type it again.</span>`;$("fadeIn").value="";renderFade();$("fadeMask").textContent=fadeCur.text;}}
$("fadeGo").onclick=checkFade;$("fadeIn").addEventListener("keydown",e=>{if(e.key==="Enter")checkFade();});

/* ---------- COLD CHECK ---------- */
(function(){let h=`<span></span>`+["masc.","fem.","neut.","plural"].map(x=>`<span class="h">${x}</span>`).join("");
  for(const c of ["A","D"]){h+=`<span class="rl" style="color:${CV[c]}">${c==="A"?"Akk":"Dat"}</span>`;
  for(const g of ["m","f","n","p"])h+=`<input type="text" data-k="${c}-${g}" aria-label="${CNAME[c]} ${GNAME[g]}" autocomplete="off" autocapitalize="off" spellcheck="false">`;}
  $("coldGrid").innerHTML=h;})();
function renderLog(){
  const perf=new Set(S.cold.filter(x=>x.p===14&&x.a===8).map(x=>x.d));
  let h=`<p><b>${perf.size>=2?"Locked. Two perfect cold checks on separate days.":perf.size===1?"One perfect day logged. Come back tomorrow for the second.":"No perfect cold check yet."}</b></p>`;
  if(S.cold.length)h+=`<p class="muted">Recent: `+S.cold.slice(-8).reverse().map(x=>`${x.d} prepositions ${x.p}/14, articles ${x.a}/8`).join("; ")+`</p>`;
  h+=`<button class="btn ghost" id="resetAll" style="margin-top:6px">Reset all progress</button>`;
  $("coldLog").innerHTML=h;
  $("resetAll").onclick=()=>{if(confirm("Clear sprint history, item speeds, fade levels and the cold-check log?")){replaceState({});}};
}
$("coldGo").onclick=()=>{
  let pr=0;const notes=[];
  for(const c of ["A","D","W"]){const el=$("c"+c),toks=norm(el.value).split(" ").filter(Boolean),want=PREPS[c].map(norm);
    const hits=new Set(toks.filter(t=>want.includes(t)));pr+=hits.size;
    const miss=PREPS[c].filter(p=>!hits.has(norm(p))),extra=toks.filter(t=>!want.includes(t)),good=!miss.length&&!extra.length;
    el.classList.toggle("right",good);el.classList.toggle("wrong",!good);
    if(miss.length)notes.push(`${CNAME[c]} missing: ${miss.join(", ")}`);if(extra.length)notes.push(`${CNAME[c]} has extras: ${extra.join(", ")}`);}
  $("cPrepFb").innerHTML=notes.length?`<span class="bad">${notes.join(". ")}.</span>`:`<span class="ok">All 14 placed.</span>`;
  let ar=0;$("coldGrid").querySelectorAll("input").forEach(i=>{const[c,g]=i.dataset.k.split("-"),want=ART[c][g];
    const ok=norm(i.value)===want||(c==="D"&&g==="p"&&norm(i.value).replace(/\s*\+?\s*n$/,"")==="den");
    i.classList.toggle("right",ok);i.classList.toggle("wrong",!ok);if(ok)ar++;else i.title="It is "+want;});
  S.cold.push({d:today(),p:pr,a:ar});save();
  $("coldFb").innerHTML=ar===8&&pr===14?`<span class="ok">Clean: 14/14 and 8/8.</span>`:`Prepositions ${pr}/14, articles ${ar}/8. Red cells show the answer on hover.`;
  renderLog();
};
$("coldClear").onclick=()=>{document.querySelectorAll("#p-cold input").forEach(i=>{i.value="";i.classList.remove("right","wrong");i.title="";});$("cPrepFb").textContent="";$("coldFb").textContent="";};

/* after a reset or import: same order as before the split */
onReplace(renderLog);onReplace(renderFade);
idle();renderLog();
