/* Service worker de Hoy Obras (demo).
 * Solo guarda en caché los archivos fijos de la interfaz (lista SHELL).
 * Cualquier otra petición (datos, identidad, otros dominios) va directa a la red y NUNCA se guarda.
 * No guarda respuestas con credenciales ni peticiones que no sean GET.
 */
var VERSION = "hoyobras-shell-demo1";
var SHELL = [
  "./", "./index.html", "./css/app.css", "./manifest.webmanifest",
  "./js/app.js", "./js/data/contract.js", "./js/data/demo.js", "./js/data/servidor.js",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/icon-maskable-192.png", "./icons/icon-maskable-512.png"
];
var SHELL_URLS = SHELL.map(function (p) { return new URL(p, self.registration.scope).href; });

self.addEventListener("install", function (ev) {
  ev.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (ev) {
  // Borra cualquier caché de versiones anteriores o con otro nombre.
  ev.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (ev) {
  var req = ev.request;
  var url = req.url.split("#")[0].split("?")[0];
  var esShell = req.method === "GET" && SHELL_URLS.indexOf(url) >= 0 && !req.headers.has("Authorization");
  if (!esShell) return; // Sin respondWith: el navegador va a la red y nada se guarda.
  ev.respondWith(caches.match(url).then(function (r) { return r || fetch(req); }));
});
