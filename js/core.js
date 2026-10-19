/* Shared helpers and UI state. No German grammar in here. */
export const $=id=>document.getElementById(id);
export const pick=a=>a[Math.floor(Math.random()*a.length)];
export const median=a=>{if(!a.length)return null;const s=a.slice().sort((x,y)=>x-y),m=s.length>>1;return s.length%2?s[m]:(s[m-1]+s[m])/2;};
export const norm=s=>(s||"").toLowerCase().replace(/ä/g,"ae").replace(/ö/g,"oe").replace(/ü/g,"ue").replace(/ß/g,"ss").replace(/[.,;]/g," ").replace(/\s+/g," ").trim();
export const today=()=>{const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");};
export const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
export const CV={A:"var(--akk)",D:"var(--dat)",W:"var(--wec)"};
export const CNAME={A:"Akkusativ",D:"Dativ",W:"Switcher"};
export const GNAME={m:"masculine",f:"feminine",n:"neuter",p:"plural"};

/* the open tab; keyboard handlers check it */
export const ui={active:"mean"};

export function seg(id,cb){document.querySelectorAll("#"+id+" button").forEach(b=>b.onclick=()=>{
  document.querySelectorAll("#"+id+" button").forEach(x=>x.setAttribute("aria-pressed",x===b));cb(b.dataset.v);});}
