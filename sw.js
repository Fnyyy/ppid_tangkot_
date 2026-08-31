const CACHE_NAME = 'ppid-kiosk-v4';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  
  // Google Fonts
  './assets/fonts/fonts.css',
  './assets/fonts/QGYvz_MVcBeNP4NJtEtq.woff2',
  './assets/fonts/QGYvz_MVcBeNP4NJuktqQ4E.woff2',
  './assets/fonts/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa0ZL7SUc.woff2',
  './assets/fonts/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7.woff2',
  './assets/fonts/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1pL7SUc.woff2',
  './assets/fonts/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa25L7SUc.woff2',
  './assets/fonts/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa2JL7SUc.woff2',
  './assets/fonts/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa2ZL7SUc.woff2',
  './assets/fonts/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa2pL7SUc.woff2',
  
  // FontAwesome
  './assets/fontawesome/css/all.min.css',
  './assets/fontawesome/webfonts/fa-brands-400.ttf',
  './assets/fontawesome/webfonts/fa-brands-400.woff2',
  './assets/fontawesome/webfonts/fa-regular-400.ttf',
  './assets/fontawesome/webfonts/fa-regular-400.woff2',
  './assets/fontawesome/webfonts/fa-solid-900.ttf',
  './assets/fontawesome/webfonts/fa-solid-900.woff2',
  
  // Images
  './assets/images/logo-ppid.png',
  './assets/images/bgkota.png',
  './assets/images/bg-wave.png',
  './assets/images/bg-teal.png',
  './assets/images/flash-ppid-38.png',
  './assets/images/flash-ppid-37.png',
  './assets/images/flash-ppid-35.png',
  './assets/images/flash-ppid-42.png',
  './assets/images/standing%20banner%20ppid%20baru%20hires%20cetak-06.png',
  './assets/images/PELAYANAN%20INFO-86-86.png',
  './assets/images/btn_ppid-19.png',
  './assets/images/qrcode.png',
  './assets/images/ALUR-PERMOHONAN-87.png',
  './assets/images/btn_ppid-18.png',
  './assets/images/SYARAT-PERMOHONAN-88.png',
  './assets/images/flow-1.png',
  './assets/images/flow-2.png',
  './assets/images/flow-3.png',
  './assets/images/btn_ppid-15.png',
  './assets/images/btn_ppid-16.png',
  './assets/images/btn_ppid-22.png',
  './assets/images/keberatan.png',
  './assets/images/btn_ppid-17.png',
  './assets/images/keberatan-89.png',
  './assets/images/btn_ppid-23.png',
  './assets/images/sengketa-1.png',
  './assets/images/SENGKETA-90.png',
  './assets/images/btn_ppid-10.png',
  './assets/images/btn_ppid-11.png',
  './assets/images/btn_ppid-12.png',
  './assets/images/btn_ppid-13.png',
  './assets/images/survey-kepuasan.jpg'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Pre-caching offline assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Clearing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event with custom handling for Video Range requests
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Check if it's a video file (mp4) and has a Range request header
  if (requestUrl.pathname.endsWith('.mp4') && event.request.headers.has('range')) {
    event.respondWith(handleRangeRequest(event.request));
  } else {
    // Standard Cache-First Strategy for other assets
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((networkResponse) => {
          // Cache new dynamically requested resources
          if (networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        });
      })
    );
  }
});

// Helper function to handle Range requests for videos offline
async function handleRangeRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request.url);

  if (!cachedResponse) {
    // If not cached, fetch from network
    return fetch(request);
  }

  const arrayBuffer = await cachedResponse.arrayBuffer();
  const rangeHeader = request.headers.get('range');
  const bytes = /^bytes=(\d+)-(\d+)?$/g.exec(rangeHeader);

  if (bytes) {
    const start = parseInt(bytes[1], 10);
    const end = bytes[2] ? parseInt(bytes[2], 10) : arrayBuffer.byteLength - 1;
    
    const chunk = arrayBuffer.slice(start, end + 1);
    
    return new Response(chunk, {
      status: 206,
      statusText: 'Partial Content',
      headers: {
        'Content-Range': `bytes ${start}-${end}/${arrayBuffer.byteLength}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunk.byteLength,
        'Content-Type': cachedResponse.headers.get('Content-Type') || 'video/mp4'
      }
    });
  }

  return new Response(arrayBuffer, {
    status: 200,
    headers: {
      'Accept-Ranges': 'bytes',
      'Content-Length': arrayBuffer.byteLength,
      'Content-Type': cachedResponse.headers.get('Content-Type') || 'video/mp4'
    }
  });
}
