const C="kasusschloss-v5";
const CORE=["./","index.html","manifest.webmanifest","apple-touch-icon.png","icon-192.png","icon-512.png",
  "js/main.js","js/core.js","js/data.js","js/store.js","js/scheduler.js","js/units.js","js/modules/rektion.js","js/modules/kasus.js","js/ui/lag.js","js/ui/unitmap.js",
  "data/rektion.json","data/kasus.json","curriculum.json"];
// cache:"reload" skips the HTTP cache so one install never mixes old and new files
self.addEventListener("install",e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(CORE.map(u=>new Request(u,{cache:"reload"})))));self.skipWaiting();});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET")return;
  e.respondWith(caches.open(C).then(c=>c.match(e.request).then(hit=>{
    const net=fetch(e.request).then(r=>{if(r&&(r.ok||r.type==="opaque"))c.put(e.request,r.clone());return r;}).catch(()=>hit);
    return hit||net;
  })));
});
