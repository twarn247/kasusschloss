/* Tab switching, shared by the tab bar and anything that sends you to a drill (Heute's session). */
import {ui} from "../core.js";
import {mAbort} from "../modules/rektion.js";
import {abort} from "../modules/kasus.js";

const renderers={};
export function onTab(p,fn){renderers[p]=fn;}
export function showTab(p){
  document.querySelectorAll("#tabs button").forEach(x=>x.setAttribute("aria-selected",x.dataset.p===p));
  document.querySelectorAll(".panel").forEach(x=>x.classList.toggle("on",x.id==="p-"+p));
  ui.active=p;if(p!=="sprint")abort();if(p!=="mean")mAbort();
  if(renderers[p])renderers[p]();
}
document.querySelectorAll("#tabs button").forEach(b=>b.onclick=()=>showTab(b.dataset.p));
