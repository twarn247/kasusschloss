/* Heute: today's session, what improved, what is still weak, and where the units stand. */
import {$} from "../core.js";
import {S,onReplace} from "../store.js";
import {UNITS,hasContent} from "../units.js";
import {todaysPlan,runRound} from "../session.js";
import {improvements,weakNow} from "../progress.js";
import {showTab,onTab} from "./tabs.js";

const TAB={rektion:"mean",kasus:"sprint"};
const st=id=>(S.units[id]&&S.units[id].state)||"locked";
const LABEL={retained:"retained",fluent:"fluent",working:"working",open:"open",assumed:"unverified",locked:"locked"};
const pct=x=>Math.round(x*100)+"%",sec=ms=>ms==null?"–":(ms/1000).toFixed(1)+" s";
const when=d=>d?d.slice(5):"baseline";

function start(i){
  const p=todaysPlan(),r=p.rounds[i];showTab(TAB[r.mod]);
  runRound(i,panel=>{
    const next=i+1<p.rounds.length,row=document.createElement("div");
    row.className="row hnext";
    row.innerHTML=next?`<button class="btn">Next in today's session: ${p.rounds[i+1].label}</button>`:`<button class="btn">Session done · back to Heute</button>`;
    row.querySelector("button").onclick=()=>next?start(i+1):showTab("heute");
    panel.prepend(row);
  });
}
function sessionCard(){
  const p=todaysPlan();
  if(!p.rounds.length)return`<p>No drills are unlocked yet.</p>`;
  const done=p.i>=p.rounds.length;
  return`<h3 style="margin-top:0">Today's session</h3><ol class="hrounds">${p.rounds.map((r,i)=>`<li class="${i<p.i?"done":i===p.i?"next":""}">
      <b>${i<p.i?"✓ ":""}${r.label}</b><br><span class="muted">${r.why}</span></li>`).join("")}</ol>
    ${done?`<p class="ok"><b>Done for today.</b> The other tabs are free practice.</p>`
      :`<button class="btn" id="hGo">${p.i?`Continue: round ${p.i+1} of ${p.rounds.length}`:`Start · ${p.rounds.length} round${p.rounds.length>1?"s":""}, about ${p.rounds.length} min`}</button>`}`;
}
function improvedHTML(){
  const{items,units}=improvements();
  if(!items.length&&!units.length)return`<p class="muted">Nothing to compare yet. Improvement shows up once an item has at least 6 answers from an earlier stretch and 6 from a later one, so give it a few days of practice.</p>`;
  const row=(name,w)=>`<div class="hrow"><span class="hname">${name}</span>
    <span class="hcmp">${pct(w.then.err)} wrong, ${sec(w.then.ms)} <span class="muted">(${when(w.then.from)})</span> → <b>${pct(w.now.err)} wrong, ${sec(w.now.ms)}</b> <span class="muted">(${when(w.now.to)})</span></span></div>`;
  return(units.length?`<h3>Units</h3>`+units.map(x=>row(x.u.id+" · "+x.u.title,x.w)).join(""):"")
    +(items.length?`<h3>Items, former weak spots first</h3>`+items.slice(0,8).map(x=>row(x.label,x.w)).join(""):"");
}
function weakHTML(){
  const w=weakNow(5);
  if(!w.length)return`<p class="muted">No item has 3 answers yet.</p>`;
  return w.map(x=>`<div class="hrow"><span class="hname">${x.label}</span>
    <span class="hcmp">${x.unit} · ${pct(x.err)} wrong, ${sec(x.ms)} median</span></div>`).join("")
    +`<p class="muted" style="font-size:15px">Today's session brings these up more often.</p>`;
}
function unitsHTML(){
  const gaps=UNITS.filter(u=>u.tags.includes("diagnosed-gap"));
  const chip=u=>`<span class="uchip-mini u-${st(u.id)}">${u.id} · ${LABEL[st(u.id)]}${hasContent(u)?"":" · no drills yet"}</span>`;
  const waiting=UNITS.filter(u=>!hasContent(u)&&st(u.id)==="open");
  return`<p><b>Diagnosed gaps:</b><br>${gaps.map(chip).join(" ")}</p>
    ${waiting.length?`<p class="muted" style="font-size:15px">Unlocked but no drills yet: ${waiting.map(u=>u.id).join(", ")}.</p>`:""}
    <button class="btn ghost" id="hAll">All units</button>`;
}
export function renderHeute(){
  $("hSession").innerHTML=sessionCard();
  $("hImproved").innerHTML=improvedHTML();
  $("hWeak").innerHTML=weakHTML();
  $("hUnits").innerHTML=unitsHTML();
  if($("hGo"))$("hGo").onclick=()=>start(todaysPlan().i);
  $("hAll").onclick=()=>showTab("units");
}
onTab("heute",renderHeute);
onReplace(()=>{if(document.getElementById("p-heute").classList.contains("on"))renderHeute();});
