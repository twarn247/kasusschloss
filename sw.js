const C="kasusschloss-v3";
const CORE=["./","index.html","manifest.webmanifest","apple-touch-icon.png","icon-192.png","icon-512.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(CORE)));self.skipWaiting();});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET")return;
  e.respondWith(caches.open(C).then(c=>c.match(e.request).then(hit=>{
    const net=fetch(e.request).then(r=>{if(r&&(r.ok||r.type==="opaque"))c.put(e.request,r.clone());return r;}).catch(()=>hit);
    return hit||net;
  })));
});
