/* Bedeutung: verb + preposition pairs (Rektion). Content: data/rektion.json. */
import {$,pick,median,norm,today,shuffle,CV,ui,seg,pressSeg} from "../core.js";
import {REKTION} from "../data.js";
import {S,save,rec,itemMed} from "../store.js";
import {nextItem,weakness} from "../scheduler.js";
import {register,evaluate} from "../units.js";
import {addDeck} from "./kasus.js";

export const MI=REKTION.pairs.map(p=>({pair:p.pair,c:p.case,en:p.en,sent:p.sentence,conf:p.confusers,syn:p.syn||"",core:!!p.core,unit:p.unit,trap:p.trap,prep:p.pair.split(" ").pop()}));
const MBY=new Map(MI.map(x=>[x.pair,x]));
MI.forEach(x=>x.conf=x.conf.filter(k=>MBY.has(k)));
export const MT={de:1600,en:1800,card:3200};          // repair target per answer, ms
export const MAIM={de:25,en:22,card:12};              // starting aims, correct per minute
export const MNAME={de:"German → English",en:"English → German",card:"Sentence card"};
/* item keys are m:<mode>:<pair>; a 1-minute sprint on a single-unit set counts toward that unit's rate aim */
const unitSprint=u=>h=>h.deck.startsWith("mean-")&&h.set===u&&h.secs===60?MAIM[h.deck.slice(5)]:null;
const MSHORT={de:"DE→EN",en:"EN→DE",card:"card"};
const pairOf=k=>MBY.get(k.split(":").slice(2).join(":"));
/* REK3's case per pair, as a Case sprint deck: same pairs and cases as the Bedeutung data; a miss shows the pair's example sentence */
addDeck("rek",{unit:"REK3",aim:30,target:1200,name:"an/auf/in pairs: Akk or Dat?",
  items:MI.filter(x=>x.unit==="REK3").map(x=>({k:"k:"+x.pair,c:x.c,label:x.pair+" · case",show:()=>x.pair,phrase:true,unit:"REK3",hint:x.sent.replace("___",x.prep)}))});
const SET_NAME={core:"core pairs",all:"all pairs",REK2:"fixed-case pairs",REK3:"an/auf/in pairs"};
register({name:"rektion",units:["REK2","REK3"],
  unitOf:k=>{if(!k.startsWith("m:"))return null;const x=pairOf(k);return x?x.unit:null;},
  /* both units: core pairs first, all pairs once both are working */
  round:(ids,{allWorking}={})=>{const set=ids.length>1?(allWorking?"all":"core"):ids[0],mode=weakestMode(set);return{cfg:{mode,set},label:"Bedeutung · "+MNAME[mode]+" · "+SET_NAME[set]};},
  start:(cfg,onDone)=>startRound(cfg,onDone),
  target:k=>k.startsWith("m:")?MT[k.split(":")[1]]:null,
  label:k=>{if(!k.startsWith("m:"))return null;const x=pairOf(k);return x?x.pair+" · "+MSHORT[k.split(":")[1]]:null;},
  sprintAim:{REK2:unitSprint("REK2"),REK3:unitSprint("REK3")}});
const cs=c=>c==="A"?"Akk":"Dat";
export const cfgM={mode:"de",set:"core"};
let ms={on:false};
const mk=x=>"m:"+cfgM.mode+":"+x.pair;
function setPool(s){return MI.filter(x=>s==="all"||(s==="core"?x.core:x.unit===s));}
function mPool(){return setPool(cfgM.set);}
/* the drill mode whose items are weakest on average, so a session round trains where it's needed */
export function weakestMode(set){const pool=setPool(set);let best="de",w=-1;
  for(const m of ["de","en","card"]){const a=pool.reduce((s,x)=>s+weakness("m:"+m+":"+x.pair),0)/pool.length;if(a>w){w=a;best=m;}}return best;}
/* one round of Heute's session: a normal 1-minute sprint; onDone gets the result panel when the clock runs out */
export function startRound({mode,set},onDone){pressSeg("segMMode",mode);pressSeg("segMSet",set);mStart(null,onDone);}
$("mCoreN").textContent=MI.filter(x=>x.core).length;$("mAllN").textContent=MI.length;
$("mRek2N").textContent=MI.filter(x=>x.unit==="REK2").length;$("mRek3N").textContent=MI.filter(x=>x.unit==="REK3").length;
seg("segMMode",v=>{cfgM.mode=v;mAbort();mIdle();});
seg("segMSet",v=>{cfgM.set=v;mAbort();mIdle();});

function mOpts(it){
  const field=cfgM.mode==="de"?"en":"pair";
  const ds=[];
  const add=x=>{if(!x||x===it||(it.syn&&x.syn===it.syn)||ds.includes(x)||ds.length>=3)return;
    if(ds.some(d=>d.syn&&d.syn===x.syn))return;ds.push(x);};
  shuffle(it.conf.map(k=>MBY.get(k))).forEach(add);
  shuffle(MI.filter(x=>x.conf.includes(it.pair))).forEach(add);
  shuffle(MI.filter(x=>x.prep===it.prep)).forEach(add);
  shuffle(MI).forEach(add);
  return {field,list:shuffle([it,...ds])};
}
function mNext(){const all=mPool();return nextItem(ms,{all,fallback:all,id:x=>x.pair,wkey:mk});}
function fbBlock(it,typed){
  const trap=it.trap;
  return `<div class="fbk">${typed!=null?`<div class="typed">${typed||"–"}</div><div class="arrow">↓</div>`:""}
    <div class="fline"><span style="color:${CV[it.c]}">${it.prep} + ${cs(it.c)}</span>  —  ${it.pair}</div>
    <div class="muted">${it.en}</div>${trap?`<div class="trap">${trap}</div>`:""}</div>`;
}
function mIdle(){
  $("mPrompt").className="mprompt";$("mPrompt").textContent="bereit";$("mSub").textContent=MNAME[cfgM.mode];
  $("mOpts").innerHTML="";$("mOpts").hidden=cfgM.mode==="card";$("mCardIn").hidden=true;$("mFb").innerHTML="";
  $("mHudC").textContent="0 right";$("mHudE").textContent="0 wrong";$("mHudT").textContent="60s";$("mClock").style.width="100%";
  $("mStartRow").hidden=false;$("mResult").hidden=true;
}
function mShow(){
  const it=ms.cur=mNext();ms.seen.add(it.pair);ms.lock=false;ms.phase="ask";$("mFb").innerHTML="";
  if(cfgM.mode==="card"){
    $("mPrompt").className="mprompt sent";
    const [a,b]=it.sent.split("___");
    $("mPrompt").innerHTML=`${a}<span class="blank">&nbsp;</span>${b}`;
    $("mSub").textContent="("+it.en+")";
    $("mCardIn").hidden=false;$("mIn").value="";$("mIn").placeholder="preposition";$("mIn").focus();
  }else{
    const o=mOpts(it);ms.opts=o.list;
    $("mPrompt").className="mprompt"+(cfgM.mode==="en"?" eng":"");
    $("mPrompt").textContent=cfgM.mode==="de"?it.pair:it.en;
    $("mSub").textContent=cfgM.mode==="de"?"what does it mean?":"which pair?";
    $("mOpts").innerHTML=o.list.map((x,i)=>`<button data-i="${i}"><kbd>${i+1}</kbd><span>${x[o.field]}</span></button>`).join("");
    $("mOpts").querySelectorAll("button").forEach(b=>b.addEventListener("pointerdown",e=>{e.preventDefault();mAnswer(+b.dataset.i);}));
  }
  ms.t0=performance.now();
}
function mStart(repair,round){
  ms={on:true,repair:!!repair,round:round||null,secs:60,c:0,e:0,rts:[],errs:[],n:0,cur:null,seen:new Set(),lock:false,need:null,pool:repair||null};
  if(repair){ms.need={};repair.forEach(x=>ms.need[x.pair]=2);}
  $("mStartRow").hidden=true;$("mResult").hidden=true;$("mOpts").hidden=cfgM.mode==="card";
  ms.end=performance.now()+ms.secs*1000;
  if(!repair)mLoop();else{$("mHudT").textContent="repair";$("mClock").style.width="100%";}
  mHud();mShow();
}
function mLoop(){
  if(!ms.on||ms.repair)return;
  const left=ms.end-performance.now();
  $("mClock").style.width=Math.max(0,left/(ms.secs*1000)*100)+"%";
  $("mHudT").textContent=Math.max(0,Math.ceil(left/1000))+"s";
  if(left<=0){mFinish();return;}
  ms.raf=requestAnimationFrame(mLoop);
}
function mHud(){
  if(ms.repair){$("mHudC").textContent=Object.values(ms.need).filter(v=>v>0).length+" to clear";$("mHudE").textContent=ms.e+" wrong";return;}
  $("mHudC").textContent=ms.c+" right";$("mHudE").textContent=ms.e+" wrong";
}
function mScore(ok,rt,shown){
  const it=ms.cur;rec(mk(it),ok,rt,it.unit);
  if(ms.repair&&it.pair in ms.need){if(ok&&rt<MT[cfgM.mode])ms.need[it.pair]--;else ms.need[it.pair]=2;}
  if(ok){ms.c++;ms.rts.push(rt);}else{ms.e++;ms.errs.push(it);}
  mHud();
  if(ms.repair&&Object.values(ms.need).every(v=>v<=0)){save();setTimeout(mRepairDone,500);return true;}
  return false;
}
function mAnswer(i){
  if(!ms.on||ms.lock||cfgM.mode==="card"||!ms.opts||!ms.opts[i])return;
  ms.lock=true;const rt=performance.now()-ms.t0,it=ms.cur,ok=ms.opts[i]===it;
  const btns=$("mOpts").querySelectorAll("button");
  btns[ms.opts.indexOf(it)].classList.add("right");if(!ok)btns[i].classList.add("wrong");
  $("mFb").innerHTML=ok?(ms.repair?`<span class="muted">${Math.round(rt)} ms${rt>=MT[cfgM.mode]?", too slow, counts as a reset":""}</span>`:""):fbBlock(it,null);
  if(mScore(ok,rt))return;
  setTimeout(()=>{if(ms.on)mShow();},ok?(ms.repair?450:160):1700);
}
$("mIn").addEventListener("keydown",e=>{
  if(e.key!=="Enter"||!ms.on||cfgM.mode!=="card")return;
  e.preventDefault();const v=norm(e.target.value);if(!v)return;const it=ms.cur;
  if(ms.phase==="fix"){
    if(v===norm(it.prep)){ms.phase="done";setTimeout(()=>{if(ms.on)mShow();},150);}
    else{e.target.value="";}
    return;
  }
  if(ms.lock)return;ms.lock=true;
  const rt=performance.now()-ms.t0,ok=v===norm(it.prep);
  const [a,b]=it.sent.split("___");
  $("mPrompt").innerHTML=`${a}<span class="blank filled" style="color:${CV[it.c]}">${it.prep}</span>${b}`;
  $("mFb").innerHTML=fbBlock(it,e.target.value.trim());
  if(mScore(ok,rt))return;
  if(ok){setTimeout(()=>{if(ms.on)mShow();},ms.repair?900:700);}
  else{ms.phase="fix";e.target.value="";e.target.placeholder="type "+it.prep+" to continue";}
});
export function mAbort(){if(ms.on){ms.on=false;cancelAnimationFrame(ms.raf);}}
function mFinish(){
  mAbort();
  const rate=ms.c,erate=ms.e,med=median(ms.rts);
  S.hist.push({d:today(),deck:"mean-"+cfgM.mode,set:cfgM.set,cond:"min",secs:60,c:ms.c,e:ms.e,med:med?Math.round(med):null});evaluate();
  const all=mPool();
  const slow=all.filter(x=>itemMed(mk(x))!=null).sort((a,b)=>itemMed(mk(b))-itemMed(mk(a))).slice(0,5);
  const missed=[...new Set(ms.errs)];
  const aim=MAIM[cfgM.mode];
  $("mPrompt").className="mprompt";$("mPrompt").textContent=rate>=aim&&ms.e<=1?"flüssig":rate+"/min";
  $("mSub").textContent="";$("mOpts").innerHTML="";$("mCardIn").hidden=true;$("mFb").innerHTML="";
  const fix=new Set(missed.concat(slow));
  $("mResult").innerHTML=`
    <div class="kpis">
      <div class="kpi"><b>${rate}</b><span>correct per minute, aim ${aim}</span></div>
      <div class="kpi"><b>${erate}</b><span>errors, aim 1 or fewer</span></div>
      <div class="kpi"><b>${med?Math.round(med):"–"}</b><span>median ms per right answer</span></div>
    </div>
    ${missed.length?`<h3>Missed</h3><div class="mlist">${missed.map(x=>`<div><b style="color:${CV[x.c]}">${x.prep} + ${cs(x.c)}</b> ${x.pair} <span class="muted">${x.en}</span></div>`).join("")}</div>`:""}
    ${slow.length?`<h3>Slowest right now</h3><div class="misslist">${slow.map(x=>`<span>${x.pair} ${Math.round(itemMed(mk(x)))} ms</span>`).join("")}</div>`:""}
    <div class="row"><button class="btn" id="mAgain">Sprint again</button>
      ${fix.size?`<button class="btn ghost" id="mRepair">Repair these ${fix.size}</button>`:""}</div>
    <p class="muted" style="font-size:14px">Repair cycles only these pairs between easy ones until each is right twice in a row under ${(MT[cfgM.mode]/1000).toFixed(1)} s. No clock, no rate logged.</p>`;
  $("mResult").hidden=false;
  $("mAgain").onclick=()=>mStart();
  if($("mRepair"))$("mRepair").onclick=()=>mStart([...fix]);
  if(ms.round)ms.round($("mResult"));
}
function mRepairDone(){
  ms.on=false;evaluate();$("mPrompt").className="mprompt";$("mPrompt").textContent="repariert";$("mSub").textContent="";
  $("mOpts").innerHTML="";$("mCardIn").hidden=true;$("mFb").innerHTML="";
  $("mResult").innerHTML=`<div class="row" style="justify-content:center"><button class="btn" id="mAgain2">Run a timed sprint</button></div>`;
  $("mResult").hidden=false;$("mAgain2").onclick=()=>mStart();
}
$("mGo").onclick=()=>mStart();
document.addEventListener("keydown",e=>{
  if(ui.active!=="mean"||e.repeat)return;
  if(e.target.tagName==="INPUT")return;
  if(!ms.on){if(e.key==="Enter"){e.preventDefault();mStart();}return;}
  const i="1234".indexOf(e.key);if(i>=0){e.preventDefault();mAnswer(i);}
});
(function(){
  const groups=new Map();
  MI.forEach(x=>{const g=x.prep+" + "+cs(x.c);if(!groups.has(g))groups.set(g,{c:x.c,items:[]});groups.get(g).items.push(x);});
  $("mRef").innerHTML=[...groups.entries()].map(([g,v])=>`<div class="rgroup"><h4 style="color:${CV[v.c]}">${g}</h4>${v.items.map(x=>`<div class="rrow"><span>${x.pair}</span><span class="muted">${x.en}</span></div>`).join("")}</div>`).join("");
})();
mIdle();
