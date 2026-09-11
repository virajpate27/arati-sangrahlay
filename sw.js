/**
 * sw.js — placeholder service worker.
 *
 * Not registered by app.js yet (no <script> calls
 * navigator.serviceWorker.register). This file exists so that
 * offline/precache support can be switched on later without
 * restructuring the project: fill in CACHE_NAME + ASSETS below,
 * then register this file from app.js.
 */

const CACHE_NAME = "aarti-sangrahalay-v1";
const ASSETS = [
  "./",
  "index.html",
  "list.html",
  "categories.html",
  "favorites.html",
  "aarti.html",
  "settings.html",
  "about.html",
  "css/main.css",
  "css/components.css",
  "css/responsive.css",
  "js/app.js",
  "js/aarti.js",
  "js/reader.js",
  "js/search.js",
  "js/favorites.js",
  "js/storage.js",
  "data/aartis.js",
  "manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).catch(() => cached))
  );
});
