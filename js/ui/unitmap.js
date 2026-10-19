/* Units tab: the curriculum graph as tracks of unit chips, colored by state. */
import {$} from "../core.js";
import {S,onReplace} from "../store.js";
import {CURRICULUM as C,UNITS,BY_ID,hasContent,accuracy,lastSprint} from "../units.js";

const STATES=["retained","fluent","working","open","assumed","locked"];
const LABEL={retained:"retained",fluent:"fluent",working:"working",open:"open",assumed:"unverified",locked:"locked"};
const HELP={
  retained:"Still fluent 3 or more days after reaching fluent. Maintenance review only.",
  fluent:"At least 95% right over the last 20 answers, and the last 1-minute sprint of this unit was at or above its aim.",
  working:"At least 85% right over the last 20 answers. Units that require this one can unlock.",
  open:"Unlocked. Needs 20 answers at 85% or better to reach working.",
  assumed:"Placed below your level and no drills yet, so it counts as known for unlocking. Not tested.",
  locked:"Something it requires isn't working yet."};
const st=id=>(S.units[id]&&S.units[id].state)||"locked";
let open=null;

function chip(u){
  const s=st(u.id),built=hasContent(u)?"":" nobuild";
  return `<button class="uchip u-${s}${built}${open===u.id?" sel":""}" data-u="${u.id}" aria-label="${u.id} ${u.title}, ${LABEL[s]}${hasContent(u)?"":", no drills yet"}">
    <b>${u.id}</b><span class="ut">${u.title}</span><span class="us">${LABEL[s]}${hasContent(u)?"":" · no drills yet"}</span></button>`;
}
function detail(u){
  const s=st(u.id),r=S.units[u.id]||{},{n,right}=accuracy(u.id),sp=lastSprint(u.id);
  const reqs=u.requires.length?u.requires.map(id=>`<span class="uchip-mini u-${st(id)}">${id} · ${LABEL[st(id)]}</span>`).join(" "):"none";
  let perf="";
  if(hasContent(u)){
    perf=`<p><b>Last ${n} answers:</b> ${n?`${right} right (${Math.round(right/n*100)}%)`:"none yet"}${n<20?`. Needs ${20-n} more to be graded.`:"."}</p>
      <p><b>Last 1-minute sprint of only this unit:</b> ${sp?`${Math.round(sp.rate)} per minute on ${sp.row.d}, aim ${sp.aim}`:"none yet"}.</p>
      ${u.content_complete?"":`<p class="muted">Only part of this unit is in the app yet, so it can reach working but not fluent.</p>`}`;
  }else perf=`<p class="muted">No drills for this unit yet.</p>`;
  return `<h3 style="margin-top:0">${u.id} · ${u.title}</h3>
    <p><span class="uchip-mini u-${s}">${LABEL[s]}</span> ${r.since?`<span class="muted">since ${r.since}</span>`:""}<br><span class="muted">${HELP[s]}</span></p>
    <p class="muted">${C.tracks[u.track].name} · ${u.level}${u.tags.includes("diagnosed-gap")?" · diagnosed gap":""}</p>
    <p>${u.scope}</p>${perf}<p><b>Requires:</b> ${reqs}</p>`;
}
export function renderUnits(){
  const counts={};UNITS.forEach(u=>{const s=st(u.id);counts[s]=(counts[s]||0)+1;});
  $("uCounts").innerHTML=STATES.filter(s=>counts[s]).map(s=>`<span class="uchip-mini u-${s}">${counts[s]} ${LABEL[s]}</span>`).join(" ");
  /* the open unit's details sit right under its own track, so they stay in view on a phone */
  $("uMap").innerHTML=Object.entries(C.tracks).map(([t,tr])=>`<div class="utrack"><h3>${tr.name}</h3><div class="urow">${UNITS.filter(u=>u.track===t).map(chip).join("")}</div>
    ${open&&BY_ID.get(open).track===t?`<div class="card udetail">${detail(BY_ID.get(open))}</div>`:""}</div>`).join("");
  $("uMap").querySelectorAll(".uchip").forEach(b=>b.onclick=()=>{open=open===b.dataset.u?null:b.dataset.u;renderUnits();});
}
onReplace(()=>{if(document.getElementById("p-units").classList.contains("on"))renderUnits();});
