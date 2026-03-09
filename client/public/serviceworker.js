// public/serviceworker.js
const STATIC_CACHE = 'lms-static-v1';
const RUNTIME_CACHE = 'lms-runtime-v1';

// essential assets to store in cache storage
const ASSETS = [
  '/',             // index.html (vite dev) 
  '/styles/HomeStyle.css', '/styles/moduleStyle.css',
  '/styles/assignmentStyle.css', '/styles/quizStyle.css',
  '/styles/lectureStyle.css', '/styles/CoursesStyle.css',
  '/styles/accountStyle.css', './vite.svg',
  '/offline.html'
];
//install 
self.addEventListener('install', event => {
  //wait until all assets are stored
  event.waitUntil(caches.open(STATIC_CACHE)
    .then(cache => cache.addAll(ASSETS))
  );
  //force this worker to activate immediately after install.
  self.skipWaiting();
});

//activate 
self.addEventListener('activate', event => {
  // wait until old caches are deleted
  event.waitUntil(
    caches.keys().then(cachenames =>
      Promise.all(cachenames.map(cache => { // delete old caches 
        if (cache !== STATIC_CACHE && cache !== RUNTIME_CACHE) {
          return caches.delete(cache)
        }
        return null
      })))
  );
  self.clients.claim(); // boost updates
});

// fetch 
self.addEventListener('fetch', event => {
  const { request } = event;
  // Only handle same-origin GET requests
  if (request.method !== 'GET' ||
    new URL(request.url).origin !== self.location.origin) {
    return;
  }
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        return await fetch(request);  // online
      } catch { //if offline
        return (await caches.match('/')) // index.html
          || (await caches.match('/offline.html'))
          || Response.error();
      }
    })());
    return;
  }
  //  CSS / images / scripts to cache and store copy
  if (['style', 'image', 'script'].includes(request.destination)) {
    event.respondWith(caches.match(request).then(cached => {
      if (cached) {//check if found in cache
        return cached;
      }
      return fetch(request).then(resp => {
        // put a clone in runtime cache for later
        if (resp.ok) {
          const copy = resp.clone();
          caches.open(RUNTIME_CACHE).then(c => c.put(request, copy));
        }
        return resp;
      });
    }));
  }
});
