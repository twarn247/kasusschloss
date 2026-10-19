/* Lag board: per-item reaction-time tiles and the daily rate chart. */
import {$,CV,seg} from "../core.js";
import {S,itemMed,itemErr} from "../store.js";
import {weakness} from "../scheduler.js";
import {MI,MT,MAIM,MNAME,cfgM} from "../modules/rektion.js";
import {DECKS,TARGET_MS,AIM} from "../modules/kasus.js";

let lagDeck="mean";
seg("segLag",v=>{lagDeck=v;renderLag();});
function lagSpec(){
  if(lagDeck==="mean"){const m=cfgM.mode;
    return{items:MI.map(x=>({k:"m:"+m+":"+x.pair,c:x.c,label:x.pair})),target:MT[m],hist:"mean-"+m,aim:MAIM[m],dot:CV.W,
      note:"Showing the "+MNAME[m]+" drill. Switch drills on the Bedeutung tab to see the others."};}
  return{items:DECKS[lagDeck],target:TARGET_MS[lagDeck],hist:lagDeck,aim:AIM[lagDeck],dot:CV[lagDeck==="prep"?"A":"D"],note:""};
}
export function renderLag(){
  const L=lagSpec();$("lagNote").textContent=L.note;
  const items=L.items.slice().sort((a,b)=>weakness(b.k)-weakness(a.k));
  const t=L.target;
  $("tiles").innerHTML=items.map(x=>{
    const m=itemMed(x.k),er=itemErr(x.k),n=(S.it[x.k]||[]).length;
    const cls=m==null?"":(m<t&&er<0.1?"fast":(m<t*1.4&&er<0.25?"mid":"slow"));
    return `<div class="tile ${cls}"><div class="w" style="color:${CV[x.c]}">${x.label}</div>
      <div class="m">${m==null?"no data":Math.round(m)+" ms"}${n?`, ${Math.round(er*100)}% wrong`:""}</div></div>`;}).join("");
  renderChart(L);
}
function renderChart(Ls){
  const rows=S.hist.filter(h=>h.deck===Ls.hist&&h.cond==="min");
  const byDay=new Map();rows.forEach(h=>{const r=h.c/(h.secs/60),cur=byDay.get(h.d);if(!cur||r>cur.r)byDay.set(h.d,{r,e:h.e/(h.secs/60)});});
  const days=[...byDay.keys()].sort().slice(-21);
  const W=640,H=260,L=40,R=12,T=12,B=34,yv=v=>T+(H-T-B)*(1-(Math.log10(Math.max(v,0.5))-Math.log10(0.5))/(Math.log10(100)-Math.log10(0.5)));
  let g=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Correct and error rate per minute by day">`;
  [0.5,1,2,5,10,20,50,100].forEach(v=>{const y=yv(v);g+=`<line x1="${L}" x2="${W-R}" y1="${y}" y2="${y}" stroke="var(--line)" stroke-width="1"/><text x="${L-6}" y="${y+4}" font-size="11" text-anchor="end" fill="var(--muted)">${v===0.5?"0":v}</text>`;});
  const ay=yv(Ls.aim);g+=`<line x1="${L}" x2="${W-R}" y1="${ay}" y2="${ay}" stroke="var(--ok)" stroke-width="2" stroke-dasharray="6 5"/>`;
  if(!days.length){g+=`<text x="${W/2}" y="${H/2}" text-anchor="middle" fill="var(--muted)" font-size="14">Run a 1-minute sprint to start the chart.</text>`;}
  const step=(W-L-R-20)/20;
  days.forEach((d,i)=>{const x=L+10+i*step,v=byDay.get(d);
    g+=`<circle cx="${x}" cy="${yv(v.r)}" r="5" fill="${Ls.dot}"/>`;
    const ey=yv(v.e);g+=`<path d="M${x-4} ${ey-4}L${x+4} ${ey+4}M${x+4} ${ey-4}L${x-4} ${ey+4}" stroke="var(--bad)" stroke-width="2"/>`;
    if(i%3===0||i===days.length-1)g+=`<text x="${x}" y="${H-12}" font-size="11" text-anchor="middle" fill="var(--muted)">${d.slice(5)}</text>`;});
  g+=`</svg>`;$("chart").innerHTML=g;
}
