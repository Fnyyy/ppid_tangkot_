/**
 * PPID KOTA TANGERANG - PORTRAIT INTERACTIVE KIOSK
 * Scene manager, tab navigation, canvas zoom/pan, QR modal
 */

document.addEventListener('DOMContentLoaded', () => {
  // Register Service Worker for PWA offline capabilities
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then((reg) => console.log('Service Worker registered successfully:', reg.scope))
      .catch((err) => console.error('Service Worker registration failed:', err));
  }

  initSceneManager();
  initTabSystem();
  initCanvasZoom();
  initQROverlay();
  initIframeOverlay();
});

/* ==========================================================================
   1. SCENE NAVIGATION MANAGER
   ========================================================================== */
function initSceneManager() {
  const allScenes = document.querySelectorAll('.app-scene');

  function navigateToScene(sceneId) {
    const target = document.getElementById(sceneId);
    if (!target) return;
    allScenes.forEach(s => {
      s.classList.toggle('active', s.id === sceneId);
    });
    
    resetAllZooms();
  }

  // All data-target buttons (includes scene AND tab switching)
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-target]');
    if (!btn) return;
    const targetId = btn.getAttribute('data-target');
    // Only handle scene targets (start with 'scene-')
    if (targetId && targetId.startsWith('scene-')) {
      navigateToScene(targetId);
    }
  });
}

/* ==========================================================================
   2. TAB SYSTEM (within scenes)
   ========================================================================== */
function initTabSystem() {
  document.querySelectorAll('.tab-bar').forEach(tabBar => {
    tabBar.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tabId = btn.getAttribute('data-tab');
        const scene = btn.closest('.app-scene');
        if (!scene || !tabId) return;

        // Update tab buttons
        tabBar.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Update tab content panels - only direct children of the scene
        scene.querySelectorAll(':scope > .tab-content').forEach(tc => {
          tc.classList.toggle('active', tc.id === tabId);
        });

        resetAllZooms();
      });
    });
  });
}


/* ==========================================================================
   4. INTERACTIVE CANVAS ZOOM & PAN
   ========================================================================== */
function initCanvasZoom() {
  const zoomStates = new Map();

  function getImg(canvas) {
    return canvas.querySelector('.zoomable-img');
  }

  function applyZoom(img, scale) {
    img.style.transform = `scale(${scale})`;
    zoomStates.set(img.id || img, scale);
  }

  // Mouse wheel zoom
  document.querySelectorAll('.interactive-canvas').forEach(canvas => {
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const img = getImg(canvas);
      if (!img) return;
      const key = img.id || img;
      let scale = zoomStates.get(key) || 1;
      scale += e.deltaY < 0 ? 0.15 : -0.15;
      scale = Math.max(0.5, Math.min(4.0, scale));
      applyZoom(img, scale);
    }, { passive: false });

    // Touch pinch-to-zoom
    let lastDist = null;
    canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        lastDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    }, { passive: true });

    canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const img = getImg(canvas);
        if (!img || !lastDist) return;
        const key = img.id || img;
        let scale = zoomStates.get(key) || 1;
        scale *= dist / lastDist;
        scale = Math.max(0.5, Math.min(4.0, scale));
        applyZoom(img, scale);
        lastDist = dist;
        e.preventDefault();
      }
    }, { passive: false });

    canvas.addEventListener('touchend', () => { lastDist = null; }, { passive: true });
  });

  // Zoom toggle buttons
  document.querySelectorAll('.btn-zoom-toggle').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const imgId = btn.getAttribute('data-zoom-target');
      const img = document.getElementById(imgId);
      if (!img) return;
      const key = img.id;
      let scale = zoomStates.get(key) || 1;
      scale = scale === 1 ? 2.0 : 1;
      applyZoom(img, scale);
    });
  });

  window.resetAllZooms = function () {
    document.querySelectorAll('.zoomable-img').forEach(img => {
      img.style.transform = 'scale(1)';
      zoomStates.set(img.id || img, 1);
    });
  };
}

/* ==========================================================================
   5. QR CODE OVERLAY MODAL
   ========================================================================== */
function initQROverlay() {
  const modal = document.getElementById('qr-modal');
  const btnClose = document.getElementById('btnCloseQR');
  const modalImg = document.getElementById('qrModalImg');
  const modalTitle = document.getElementById('qrModalTitle');

  function showModal(src, title) {
    if (!modal || !modalImg) return;
    modalImg.src = src;
    if (modalTitle) modalTitle.textContent = title || 'Scan QR Code';
    modal.classList.add('show');
  }

  function closeModal() {
    if (modal) modal.classList.remove('show');
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-show-qr');
    if (!btn) return;
    const src = btn.getAttribute('data-qr');
    const title = btn.getAttribute('data-qr-title');
    if (src) showModal(src, title);
  });

  if (btnClose) btnClose.addEventListener('click', closeModal);
  if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
}

/* ==========================================================================
   6. IFRAME OVERLAY MODAL
   ========================================================================== */
function initIframeOverlay() {
  const modal = document.getElementById('iframe-modal');
  const btnClose = document.getElementById('btnCloseIframe');
  const docIframe = document.getElementById('docIframe');
  const modalTitle = document.getElementById('iframeModalTitle');

  function showModal(url, title) {
    if (!modal || !docIframe) return;
    docIframe.src = url;
    if (modalTitle) modalTitle.textContent = title || 'Dokumen Informasi';
    modal.classList.add('show');
  }

  function closeModal() {
    if (modal) {
      modal.classList.remove('show');
      if (docIframe) docIframe.src = '';
    }
  }

  document.addEventListener('click', (e) => {
    // Check if clicked element is dh-pdf-link or dteal-link
    const link = e.target.closest('.dh-pdf-link') || e.target.closest('.dteal-link');
    if (!link) return;
    
    // Prevent default opening in new tab
    e.preventDefault();
    
    const url = link.getAttribute('href');
    
    // Find text content for the modal title
    let title = 'Dokumen Informasi';
    const textElement = link.querySelector('.dh-card-title') || link.querySelector('.dteal-text');
    if (textElement) {
      title = textElement.textContent.trim();
    }
    
    if (url) showModal(url, title);
  });

  if (btnClose) btnClose.addEventListener('click', closeModal);
  if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
}

/* ==========================================================================
   7. LOAD EXTERNAL WEB INTO IFRAME (CORS BYPASS)
   ========================================================================== */
let dhWebLoaded = false;
function loadDasarHukumWeb() {
  if (dhWebLoaded) return; // Only load once
  
  const iframe = document.getElementById('mainDasarHukumIframe');
  const loader = document.getElementById('iframeLoadingIndicator');
  if (!iframe) return;

  const targetUrl = 'https://ppid.tangerangkota.go.id/dasar_hukum';
  // Use a reliable public CORS proxy
  const proxyUrl = 'https://api.allorigins.win/get?url=' + encodeURIComponent(targetUrl);

  fetch(proxyUrl)
    .then(response => {
      if (response.ok) return response.json();
      throw new Error('Network response was not ok.');
    })
    .then(data => {
      let html = data.contents;
      // Inject base tag so relative links/assets (css, images) load correctly from the original site
      if (html.includes('<head>')) {
        html = html.replace('<head>', '<head><base href="https://ppid.tangerangkota.go.id/">');
      } else {
        html = '<head><base href="https://ppid.tangerangkota.go.id/"></head>' + html;
      }
      
      // Inject a script to disable all link targets so they don't pop out
      const injectScript = `<script>
        document.addEventListener('click', function(e) {
          const link = e.target.closest('a');
          if (link) link.removeAttribute('target');
        });
      </script>`;
      html = html.replace('</body>', injectScript + '</body>');

      // Set the content directly into the iframe
      iframe.srcdoc = html;
      
      // Hide loader once the iframe finishes processing the injected HTML
      if (loader) loader.style.display = 'none';
      dhWebLoaded = true;
    })
    .catch(error => {
      console.error('Error loading PPID web:', error);
      if (loader) {
        loader.innerHTML = '<div style="color:#ef4444;"><i class="fa-solid fa-triangle-exclamation fa-2x"></i><br/>Gagal memuat situs. Pastikan Anda terhubung ke internet.</div>';
      }
    });
}
