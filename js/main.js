/* Entry point: tabs and the progress backup footer. Modules wire up their own panels on import. */
import {$,today,ui} from "./core.js";
import {exportJSON,importJSON} from "./store.js";
import {mAbort} from "./modules/rektion.js";
import {abort,renderFade} from "./modules/kasus.js";
import {renderLag} from "./ui/lag.js";
import {initUnits} from "./units.js";
import {renderUnits} from "./ui/unitmap.js";

initUnits();

/* tabs */
document.querySelectorAll("#tabs button").forEach(b=>b.onclick=()=>{
  document.querySelectorAll("#tabs button").forEach(x=>x.setAttribute("aria-selected",x===b));
  document.querySelectorAll(".panel").forEach(p=>p.classList.toggle("on",p.id==="p-"+b.dataset.p));
  ui.active=b.dataset.p;if(ui.active!=="sprint")abort();if(ui.active!=="mean")mAbort();
  if(ui.active==="lag")renderLag();if(ui.active==="fade")renderFade();if(ui.active==="units")renderUnits();
});

/* ---------- BACKUP ---------- */
$("bkExp").onclick=()=>{
  try{const blob=new Blob([exportJSON()],{type:"application/json"});const a=document.createElement("a");
    a.href=URL.createObjectURL(blob);a.download="kasusschloss-progress-"+today()+".json";document.body.appendChild(a);a.click();
    setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},500);$("bkFb").textContent="Exported.";}
  catch(e){$("bkFb").textContent="This browser blocked the download. Open the app in a regular browser tab to export.";}
};
$("bkImp").onchange=e=>{
  const f=e.target.files[0];if(!f)return;const r=new FileReader();
  r.onload=()=>{try{importJSON(r.result);$("bkFb").textContent="Imported. Your history now matches the file.";}
    catch(err){$("bkFb").textContent="That file isn't a Kasusschloss export.";}};
  r.readAsText(f);e.target.value="";
};
